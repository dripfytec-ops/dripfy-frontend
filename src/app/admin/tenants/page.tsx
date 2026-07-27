'use client';
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import {
  Plus, X, Building2, Search, LogIn, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, KeyRound, Smartphone, Wallet, ArrowUpCircle, ArrowDownCircle,
  SlidersHorizontal, AlertTriangle, Megaphone, Users as UsersIcon,
} from 'lucide-react';
import api from '@/lib/api';
import { auth } from '@/lib/auth';
import { Tenant, CreditoTransacaoTipo, MensalidadeFaturaStatus } from '@/types';
import { useExtratoCreditosTenant, useInvoicesPendentesTenant, useConfirmarPagamentoInvoice } from '@/lib/financeiro-api';
import { useMensalidadeTenant, useCampanhasTenant, useConfirmarPagamentoMensalidade, useConfirmarPagamentoAvulso, useAtualizarPlano } from '@/lib/assinatura-api';

const schema = z.object({
  nome_empresa: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  nome_responsavel: z.string().optional(),
  email_contato: z.string().email('E-mail inválido').optional().or(z.literal('')),
  admin_nome: z.string().min(2),
  admin_email: z.string().email(),
  admin_password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

const STATUS_BADGE: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  inativo: 'bg-red-100 text-red-700',
  trial: 'bg-yellow-100 text-yellow-700',
};

const ROLE_LABEL: Record<string, string> = {
  admin_master: 'Master',
  lojista_admin: 'Admin',
  lojista_usuario: 'Usuário',
  atendente: 'Atendente',
};

const CREDITO_TIPO_CONFIG: Record<CreditoTransacaoTipo, { label: string; icon: React.ElementType; className: string }> = {
  compra: { label: 'Compra', icon: ArrowUpCircle, className: 'text-green-600' },
  consumo: { label: 'Consumo', icon: ArrowDownCircle, className: 'text-red-600' },
  ajuste: { label: 'Ajuste', icon: SlidersHorizontal, className: 'text-blue-600' },
};

const FATURA_STATUS_CONFIG: Record<MensalidadeFaturaStatus, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-amber-100 text-amber-700' },
  pago: { label: 'Pago', className: 'bg-green-100 text-green-700' },
  cancelado: { label: 'Cancelado', className: 'bg-gray-100 text-gray-500' },
};

const CAMPANHA_STATUS_LABEL: Record<string, string> = {
  rascunho: 'Rascunho', agendada: 'Agendada', em_andamento: 'Em Andamento', concluida: 'Concluída',
  pausada: 'Pausada', aguardando_recarga: 'Aguardando Recarga', aguardando_pagamento: 'Aguardando Pagamento',
};

type TenantDetail = {
  id: string;
  nome_empresa: string;
  slug: string;
  cnpj: string | null;
  telefone: string | null;
  nome_responsavel: string | null;
  email_contato: string | null;
  status_assinatura: string;
  criado_em: string;
  assinatura_bloqueada: boolean;
  users: Array<{ id: string; nome: string; email: string; role: string; ativo: boolean }>;
  dm_canais: Array<{ id: string; nome: string; phone_number_id: string; ativo: boolean }>;
  _count: { leads: number; dm_campanhas: number };
};

function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatarMoeda(valor: string | number): string {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const TABS = [
  { key: 'resumo', label: 'Resumo' },
  { key: 'dados', label: 'Dados Cadastrais' },
  { key: 'conta-corrente', label: 'Conta Corrente' },
  { key: 'historico', label: 'Histórico' },
  { key: 'disparos', label: 'Disparos' },
] as const;
type TabKey = typeof TABS[number]['key'];

const PAGE_SIZE = 7;

export default function TenantsPage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('resumo');
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [resetingUserId, setResetingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleEnterAsTenant = async (tenantId: string) => {
    const masterToken = auth.getToken();
    const masterUser = auth.getUser();
    if (!masterToken || !masterUser) return;
    setImpersonatingId(tenantId);
    try {
      const { data } = await api.post(`/tenants/${tenantId}/impersonate`);
      auth.startImpersonation(masterToken, masterUser, data.access_token, data.user);
      router.push('/dashboard');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao entrar no tenant.');
    } finally {
      setImpersonatingId(null);
    }
  };

  const { data: tenants = [], isLoading } = useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: async () => (await api.get('/tenants')).data,
  });

  const tenantsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return tenants;
    return tenants.filter((t) => t.nome_empresa.toLowerCase().includes(termo) || t.slug.toLowerCase().includes(termo));
  }, [tenants, busca]);

  const totalPaginas = Math.max(1, Math.ceil(tenantsFiltrados.length / PAGE_SIZE));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const tenantsPagina = tenantsFiltrados.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE);

  const { data: tenantDetail, isLoading: detailLoading } = useQuery<TenantDetail>({
    queryKey: ['tenant-detail', selectedId],
    queryFn: async () => (await api.get(`/tenants/${selectedId}`)).data,
    enabled: !!selectedId,
  });

  const { data: extrato, isLoading: extratoLoading } = useExtratoCreditosTenant(selectedId);
  const { data: invoicesPendentes = [] } = useInvoicesPendentesTenant(selectedId);
  const confirmarPagamentoInvoice = useConfirmarPagamentoInvoice(selectedId || '');
  const { data: mensalidade, isLoading: mensalidadeLoading } = useMensalidadeTenant(selectedId);
  const { data: campanhas = [], isLoading: campanhasLoading } = useCampanhasTenant(selectedId);
  const confirmarPagamento = useConfirmarPagamentoMensalidade(selectedId || '');
  const confirmarPagamentoAvulso = useConfirmarPagamentoAvulso(selectedId || '');
  const atualizarPlano = useAtualizarPlano(selectedId || '');
  const [editandoPlano, setEditandoPlano] = useState(false);
  const [planoForm, setPlanoForm] = useState({ usuarios_inclusos: '', valor_mensalidade_base: '', valor_usuario_adicional: '' });
  const [editandoDados, setEditandoDados] = useState(false);
  const [dadosForm, setDadosForm] = useState({ cnpj: '', telefone: '', nome_responsavel: '', email_contato: '' });

  const atualizarDadosCadastrais = useMutation({
    mutationFn: (dto: typeof dadosForm) => api.patch(`/tenants/${selectedId}/dados-cadastrais`, {
      ...dto,
      email_contato: dto.email_contato || undefined,
    }),
    onSuccess: () => {
      toast.success('Dados cadastrais atualizados.');
      queryClient.invalidateQueries({ queryKey: ['tenant-detail', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setEditandoDados(false);
    },
    onError: () => toast.error('Erro ao atualizar dados cadastrais.'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const create = useMutation({
    mutationFn: (data: FormData) => api.post('/tenants', data),
    onSuccess: () => {
      toast.success('Lojista criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setModalOpen(false);
      reset();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro ao criar lojista.'),
  });

  const toggleUser = useMutation({
    mutationFn: (userId: string) => api.patch(`/users/${userId}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-detail', selectedId] });
      toast.success('Status atualizado.');
    },
    onError: () => toast.error('Erro ao atualizar status.'),
  });

  const resetPassword = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      api.patch(`/users/${userId}/reset-password`, { new_password: password }),
    onSuccess: () => {
      toast.success('Senha redefinida com sucesso!');
      setResetingUserId(null);
      setNewPassword('');
    },
    onError: () => toast.error('Erro ao redefinir senha.'),
  });

  const updateTenantStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/tenants/${id}/status`, { status_assinatura: status }),
    onSuccess: () => {
      toast.success('Status do tenant atualizado.');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-detail', selectedId] });
    },
    onError: () => toast.error('Erro ao atualizar status.'),
  });

  const selecionarTenant = (id: string) => {
    setSelectedId(id);
    setActiveTab('resumo');
    setResetingUserId(null);
    setEditandoPlano(false);
    setEditandoDados(false);
  };

  return (
    <div className="p-6 h-[calc(100vh-56px)] flex flex-col">
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Coluna esquerda: lista de lojistas */}
        <div className="w-[380px] flex-shrink-0 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
            <h1 className="font-bold text-gray-900">Lojistas</h1>
            <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5">
              <Plus size={14} /> Novo
            </button>
          </div>
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
                placeholder="Buscar lojista..."
                className="input pl-8 text-sm py-2"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {isLoading && (
              <div className="flex justify-center p-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!isLoading && tenantsPagina.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">Nenhum lojista encontrado.</p>
            )}
            {!isLoading && tenantsPagina.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => selecionarTenant(tenant.id)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                  selectedId === tenant.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-brand">
                  {tenant.nome_empresa.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{tenant.nome_empresa}</p>
                  <p className="text-xs text-gray-400 truncate">/{tenant.slug}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[tenant.status_assinatura]}`}>
                    {tenant.status_assinatura}
                  </span>
                  {tenant.assinatura_bloqueada && (
                    <span className="flex items-center gap-0.5 text-[10px] text-red-600 font-medium">
                      <AlertTriangle size={10} /> Em atraso
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              {tenantsFiltrados.length === 0 ? '0 lojistas' : `Mostrando ${(paginaAtual - 1) * PAGE_SIZE + 1} a ${Math.min(paginaAtual * PAGE_SIZE, tenantsFiltrados.length)} de ${tenantsFiltrados.length}`}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaAtual <= 1}
                className="p-1 rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-1.5">{paginaAtual}/{totalPaginas}</span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual >= totalPaginas}
                className="p-1 rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Coluna direita: detalhe do lojista selecionado */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          {!selectedId && (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Selecione um lojista pra ver os detalhes.
            </div>
          )}

          {selectedId && (
            <>
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-sm font-bold text-brand flex-shrink-0">
                    {tenantDetail?.nome_empresa.slice(0, 2).toUpperCase() || '...'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-gray-900">{tenantDetail?.nome_empresa || '...'}</h2>
                      {tenantDetail && (
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[tenantDetail.status_assinatura]}`}>
                          {tenantDetail.status_assinatura}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs font-mono">/{tenantDetail?.slug}</p>
                    <p className="text-gray-400 text-xs">Cadastrado em {formatarData(tenantDetail?.criado_em)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleEnterAsTenant(selectedId)}
                  disabled={impersonatingId === selectedId}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <LogIn size={13} />
                  {impersonatingId === selectedId ? 'Entrando...' : 'Entrar como este tenant'}
                </button>
              </div>

              {tenantDetail?.assinatura_bloqueada ?? mensalidade?.assinatura_bloqueada ? (
                <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 text-xs font-medium px-3 py-2.5 rounded-lg">
                  <AlertTriangle size={14} /> Assinatura em atraso — funcionalidades do lojista estão bloqueadas até a confirmação do pagamento.
                </div>
              ) : null}

              <div className="px-6 border-b border-gray-100 flex items-center gap-1 mt-4">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'resumo' && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status da Assinatura</p>
                    <div className="flex gap-2 mb-5">
                      {(['trial', 'ativo', 'inativo'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => updateTenantStatus.mutate({ id: selectedId, status: s })}
                          disabled={updateTenantStatus.isPending}
                          className={`flex-1 text-xs py-1.5 rounded-lg font-medium border transition-colors ${
                            tenantDetail?.status_assinatura === s
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="border border-gray-100 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1"><UsersIcon size={12} /> Usuários</div>
                        <p className="text-lg font-bold text-gray-900">{tenantDetail?.users.length ?? '—'}</p>
                      </div>
                      <div className="border border-gray-100 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1"><Megaphone size={12} /> Campanhas</div>
                        <p className="text-lg font-bold text-gray-900">{tenantDetail?._count.dm_campanhas ?? '—'}</p>
                      </div>
                      <div className="border border-gray-100 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1"><Wallet size={12} /> Créditos Dripfy</div>
                        <p className="text-lg font-bold text-gray-900">{extratoLoading ? '—' : (extrato?.creditos_saldo ?? 0)}</p>
                      </div>
                      <div className="border border-gray-100 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1"><Building2 size={12} /> Leads</div>
                        <p className="text-lg font-bold text-gray-900">{tenantDetail?._count.leads ?? '—'}</p>
                      </div>
                    </div>

                    {mensalidade && (
                      <div className="mt-5 border border-gray-100 rounded-xl p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mensalidade</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">{formatarMoeda(mensalidade.valor_mensal_atual)}<span className="text-sm font-normal text-gray-400">/mês</span></p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {mensalidade.usuarios_atual} usuário(s) — {mensalidade.usuarios_extras_atual > 0 ? `${mensalidade.usuarios_extras_atual} extra(s) além dos ${mensalidade.usuarios_inclusos} inclusos` : `dentro dos ${mensalidade.usuarios_inclusos} inclusos`}
                            </p>
                          </div>
                          {mensalidade.proxima_cobranca_em && (
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Próxima cobrança</p>
                              <p className="text-sm font-medium text-gray-700">{formatarData(mensalidade.proxima_cobranca_em)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'dados' && (
                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dados Cadastrais</p>
                        {tenantDetail && !editandoDados && (
                          <button
                            onClick={() => {
                              setDadosForm({
                                cnpj: tenantDetail.cnpj || '',
                                telefone: tenantDetail.telefone || '',
                                nome_responsavel: tenantDetail.nome_responsavel || '',
                                email_contato: tenantDetail.email_contato || '',
                              });
                              setEditandoDados(true);
                            }}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Editar
                          </button>
                        )}
                      </div>
                      {!tenantDetail ? (
                        <p className="text-gray-400 text-sm">Carregando...</p>
                      ) : editandoDados ? (
                        <div className="space-y-3 border border-gray-100 rounded-xl p-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">CNPJ</label>
                              <input
                                value={dadosForm.cnpj}
                                onChange={(e) => setDadosForm((p) => ({ ...p, cnpj: e.target.value }))}
                                className="input text-sm py-1.5"
                                placeholder="12.345.678/0001-90"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Telefone</label>
                              <input
                                value={dadosForm.telefone}
                                onChange={(e) => setDadosForm((p) => ({ ...p, telefone: e.target.value }))}
                                className="input text-sm py-1.5"
                                placeholder="(41) 99999-9999"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Nome do Responsável</label>
                              <input
                                value={dadosForm.nome_responsavel}
                                onChange={(e) => setDadosForm((p) => ({ ...p, nome_responsavel: e.target.value }))}
                                className="input text-sm py-1.5"
                                placeholder="João Silva"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">E-mail de Contato</label>
                              <input
                                value={dadosForm.email_contato}
                                onChange={(e) => setDadosForm((p) => ({ ...p, email_contato: e.target.value }))}
                                className="input text-sm py-1.5"
                                placeholder="contato@lojajoao.com"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditandoDados(false)} className="btn-outline text-xs px-3 py-1.5">Cancelar</button>
                            <button
                              onClick={() => atualizarDadosCadastrais.mutate(dadosForm)}
                              disabled={atualizarDadosCadastrais.isPending}
                              className="btn-primary text-xs px-3 py-1.5"
                            >
                              {atualizarDadosCadastrais.isPending ? 'Salvando...' : 'Salvar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><span className="text-gray-400">CNPJ</span><p className="font-medium text-gray-800">{tenantDetail.cnpj || '—'}</p></div>
                          <div><span className="text-gray-400">Telefone</span><p className="font-medium text-gray-800">{tenantDetail.telefone || '—'}</p></div>
                          <div><span className="text-gray-400">Nome do Responsável</span><p className="font-medium text-gray-800">{tenantDetail.nome_responsavel || '—'}</p></div>
                          <div><span className="text-gray-400">E-mail de Contato</span><p className="font-medium text-gray-800">{tenantDetail.email_contato || '—'}</p></div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Plano Contratado</p>
                        {mensalidade && !editandoPlano && (
                          <button
                            onClick={() => {
                              setPlanoForm({
                                usuarios_inclusos: String(mensalidade.usuarios_inclusos),
                                valor_mensalidade_base: String(mensalidade.valor_mensalidade_base),
                                valor_usuario_adicional: String(mensalidade.valor_usuario_adicional),
                              });
                              setEditandoPlano(true);
                            }}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Editar Plano
                          </button>
                        )}
                      </div>
                      {mensalidadeLoading || !mensalidade ? (
                        <p className="text-gray-400 text-sm">Carregando...</p>
                      ) : editandoPlano ? (
                        <div className="space-y-3 border border-gray-100 rounded-xl p-4">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Usuários inclusos</label>
                              <input
                                type="number" min={0}
                                value={planoForm.usuarios_inclusos}
                                onChange={(e) => setPlanoForm((p) => ({ ...p, usuarios_inclusos: e.target.value }))}
                                className="input text-sm py-1.5"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Valor base (R$)</label>
                              <input
                                type="number" min={0} step="0.01"
                                value={planoForm.valor_mensalidade_base}
                                onChange={(e) => setPlanoForm((p) => ({ ...p, valor_mensalidade_base: e.target.value }))}
                                className="input text-sm py-1.5"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Valor/usuário extra (R$)</label>
                              <input
                                type="number" min={0} step="0.01"
                                value={planoForm.valor_usuario_adicional}
                                onChange={(e) => setPlanoForm((p) => ({ ...p, valor_usuario_adicional: e.target.value }))}
                                className="input text-sm py-1.5"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditandoPlano(false)} className="btn-outline text-xs px-3 py-1.5">Cancelar</button>
                            <button
                              onClick={() => {
                                atualizarPlano.mutate({
                                  usuarios_inclusos: Number(planoForm.usuarios_inclusos),
                                  valor_mensalidade_base: Number(planoForm.valor_mensalidade_base),
                                  valor_usuario_adicional: Number(planoForm.valor_usuario_adicional),
                                }, {
                                  onSuccess: () => { toast.success('Plano atualizado.'); setEditandoPlano(false); },
                                  onError: () => toast.error('Erro ao atualizar plano.'),
                                });
                              }}
                              disabled={atualizarPlano.isPending}
                              className="btn-primary text-xs px-3 py-1.5"
                            >
                              {atualizarPlano.isPending ? 'Salvando...' : 'Salvar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><span className="text-gray-400">Pacote Start</span><p className="font-medium text-gray-800">{formatarMoeda(mensalidade.valor_mensalidade_base)} ({mensalidade.usuarios_inclusos} usuários inclusos)</p></div>
                          <div><span className="text-gray-400">Usuário adicional</span><p className="font-medium text-gray-800">{formatarMoeda(mensalidade.valor_usuario_adicional)}/usuário</p></div>
                          <div><span className="text-gray-400">Usuários atuais</span><p className="font-medium text-gray-800">{mensalidade.usuarios_atual} ({mensalidade.usuarios_extras_atual} extra(s))</p></div>
                          <div><span className="text-gray-400">Valor mensal calculado</span><p className="font-medium text-gray-800">{formatarMoeda(mensalidade.valor_mensal_atual)}</p></div>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Usuários</p>
                      {detailLoading ? (
                        <div className="flex justify-center p-6">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : tenantDetail?.users.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-4">Nenhum usuário cadastrado.</p>
                      ) : (
                        <div className="space-y-2">
                          {tenantDetail?.users.map((user) => (
                            <div key={user.id} className="border border-gray-100 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-gray-900 truncate">{user.nome}</p>
                                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                      {ROLE_LABEL[user.role] || user.role}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                  <button
                                    onClick={() => toggleUser.mutate(user.id)}
                                    disabled={toggleUser.isPending}
                                    className={`text-xs px-2 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors ${
                                      user.ativo
                                        ? 'text-green-700 bg-green-50 hover:bg-red-50 hover:text-red-600'
                                        : 'text-red-600 bg-red-50 hover:bg-green-50 hover:text-green-700'
                                    }`}
                                    title={user.ativo ? 'Clique para desativar' : 'Clique para ativar'}
                                  >
                                    {user.ativo ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                    {user.ativo ? 'Ativo' : 'Inativo'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setResetingUserId(resetingUserId === user.id ? null : user.id);
                                      setNewPassword('');
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Redefinir senha"
                                  >
                                    <KeyRound size={14} />
                                  </button>
                                </div>
                              </div>

                              {resetingUserId === user.id && (
                                <div className="mt-2 pt-2 border-t border-gray-100 flex gap-2">
                                  <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="input flex-1 text-sm py-1.5"
                                    placeholder="Nova senha (mín. 8 caracteres)"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => {
                                      if (newPassword.length < 8) { toast.error('Mínimo 8 caracteres.'); return; }
                                      resetPassword.mutate({ userId: user.id, password: newPassword });
                                    }}
                                    disabled={resetPassword.isPending}
                                    className="btn-primary text-xs px-3 py-1.5 whitespace-nowrap"
                                  >
                                    {resetPassword.isPending ? '...' : 'Salvar'}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {tenantDetail && tenantDetail.dm_canais.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Canais WhatsApp</p>
                        <div className="space-y-2">
                          {tenantDetail.dm_canais.map((canal) => (
                            <div key={canal.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${canal.ativo ? 'bg-green-400' : 'bg-gray-300'}`} />
                              <Smartphone size={14} className="text-gray-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{canal.nome}</p>
                                <p className="text-xs text-gray-400 font-mono truncate">{canal.phone_number_id}</p>
                              </div>
                              <span className={`text-xs flex-shrink-0 ${canal.ativo ? 'text-green-600' : 'text-gray-400'}`}>
                                {canal.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'conta-corrente' && (
                  <div>
                    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg mb-4">
                      <Wallet size={18} className="text-amber-500" />
                      <div>
                        <p className="text-xs text-gray-500">Saldo de créditos Dripfy</p>
                        <p className="text-lg font-bold text-gray-900">{extratoLoading ? '—' : `${extrato?.creditos_saldo ?? 0} créditos`}</p>
                      </div>
                    </div>

                    {invoicesPendentes.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Cobranças Pendentes</p>
                        <div className="space-y-1.5">
                          {invoicesPendentes.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between text-xs border border-amber-100 bg-amber-50 rounded-lg px-3 py-2.5">
                              <span className="text-gray-700">{inv.quantidade_creditos} créditos — {formatarMoeda(inv.valor_total)}</span>
                              <button
                                onClick={() => confirmarPagamentoInvoice.mutate(inv.id, {
                                  onSuccess: () => toast.success('Pagamento confirmado, créditos liberados!'),
                                  onError: () => toast.error('Erro ao confirmar pagamento.'),
                                })}
                                disabled={confirmarPagamentoInvoice.isPending}
                                className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                              >
                                Confirmar Pagamento
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {extratoLoading ? (
                      <div className="flex justify-center p-6">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : extrato && extrato.transacoes.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">Nenhuma movimentação ainda.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {extrato?.transacoes.map((t) => {
                          const cfg = CREDITO_TIPO_CONFIG[t.tipo];
                          const Icon = cfg.icon;
                          return (
                            <div key={t.id} className="flex items-center justify-between text-xs border border-gray-100 rounded-lg px-3 py-2.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Icon size={12} className={`${cfg.className} flex-shrink-0`} />
                                <span className="text-gray-600 truncate">{t.descricao}</span>
                              </div>
                              <span className={`font-mono font-medium flex-shrink-0 ml-2 ${t.quantidade >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {t.quantidade >= 0 ? '+' : ''}{t.quantidade}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'historico' && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Faturas de Mensalidade</p>
                    {mensalidadeLoading ? (
                      <div className="flex justify-center p-6">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : !mensalidade?.faturas || mensalidade.faturas.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">Nenhuma fatura gerada ainda.</p>
                    ) : (
                      <div className="border border-gray-100 rounded-xl overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                              <th className="text-left px-4 py-2.5 font-medium">Competência</th>
                              <th className="text-left px-4 py-2.5 font-medium">Usuários</th>
                              <th className="text-left px-4 py-2.5 font-medium">Vencimento</th>
                              <th className="text-right px-4 py-2.5 font-medium">Valor</th>
                              <th className="text-left px-4 py-2.5 font-medium">Status</th>
                              <th className="text-right px-4 py-2.5 font-medium">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {mensalidade.faturas.map((f) => {
                              const cfg = FATURA_STATUS_CONFIG[f.status];
                              const vencida = f.status === 'pendente' && new Date(f.vencimento) < new Date();
                              return (
                                <tr key={f.id}>
                                  <td className="px-4 py-2.5 font-medium text-gray-800">{f.competencia}</td>
                                  <td className="px-4 py-2.5 text-gray-500">{f.usuarios_cobrados} ({f.usuarios_extras} extra)</td>
                                  <td className="px-4 py-2.5 text-gray-500">{formatarData(f.vencimento)}</td>
                                  <td className="px-4 py-2.5 text-right font-mono text-gray-700">{formatarMoeda(f.valor_total)}</td>
                                  <td className="px-4 py-2.5">
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${vencida ? 'bg-red-100 text-red-700' : cfg.className}`}>
                                      {vencida ? 'Atrasado' : cfg.label}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    {f.status === 'pendente' && (
                                      <button
                                        onClick={() => confirmarPagamento.mutate(f.id)}
                                        disabled={confirmarPagamento.isPending}
                                        className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                                      >
                                        Confirmar Pagamento
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">Cobranças de Usuário Extra</p>
                    {mensalidadeLoading ? (
                      <div className="flex justify-center p-6">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : !mensalidade?.cobrancas_avulsas || mensalidade.cobrancas_avulsas.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">Nenhuma cobrança avulsa gerada ainda.</p>
                    ) : (
                      <div className="border border-gray-100 rounded-xl overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                              <th className="text-left px-4 py-2.5 font-medium">Usuário</th>
                              <th className="text-left px-4 py-2.5 font-medium">Criada em</th>
                              <th className="text-right px-4 py-2.5 font-medium">Valor</th>
                              <th className="text-left px-4 py-2.5 font-medium">Status</th>
                              <th className="text-right px-4 py-2.5 font-medium">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {mensalidade.cobrancas_avulsas.map((c) => {
                              const cfg = FATURA_STATUS_CONFIG[c.status];
                              return (
                                <tr key={c.id}>
                                  <td className="px-4 py-2.5 font-medium text-gray-800">{c.user?.nome || '—'}</td>
                                  <td className="px-4 py-2.5 text-gray-500">{formatarData(c.criado_em)}</td>
                                  <td className="px-4 py-2.5 text-right font-mono text-gray-700">{formatarMoeda(c.valor)}</td>
                                  <td className="px-4 py-2.5">
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cfg.className}`}>{cfg.label}</span>
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    {c.status === 'pendente' && (
                                      <button
                                        onClick={() => confirmarPagamentoAvulso.mutate(c.id)}
                                        disabled={confirmarPagamentoAvulso.isPending}
                                        className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                                      >
                                        Confirmar Pagamento
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'disparos' && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Campanhas</p>
                    {campanhasLoading ? (
                      <div className="flex justify-center p-6">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : campanhas.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">Nenhuma campanha criada ainda.</p>
                    ) : (
                      <div className="border border-gray-100 rounded-xl overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                              <th className="text-left px-4 py-2.5 font-medium">Campanha</th>
                              <th className="text-left px-4 py-2.5 font-medium">Tipo</th>
                              <th className="text-left px-4 py-2.5 font-medium">Status</th>
                              <th className="text-right px-4 py-2.5 font-medium">Contatos</th>
                              <th className="text-right px-4 py-2.5 font-medium">Entregues</th>
                              <th className="text-left px-4 py-2.5 font-medium">Criada em</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {campanhas.map((c) => (
                              <tr key={c.id}>
                                <td className="px-4 py-2.5 font-medium text-gray-800">{c.nome}</td>
                                <td className="px-4 py-2.5 text-gray-500 capitalize">{c.tipo}</td>
                                <td className="px-4 py-2.5 text-gray-500">{CAMPANHA_STATUS_LABEL[c.status] || c.status}</td>
                                <td className="px-4 py-2.5 text-right font-mono text-gray-700">{c.total_contatos}</td>
                                <td className="px-4 py-2.5 text-right font-mono text-gray-700">{c.entregues}</td>
                                <td className="px-4 py-2.5 text-gray-500">{formatarData(c.criado_em)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Novo Lojista */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-lg">Novo Lojista</h2>
              <button onClick={() => { setModalOpen(false); reset(); }}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit((d) => create.mutate({
              ...d,
              cnpj: d.cnpj || undefined,
              telefone: d.telefone || undefined,
              nome_responsavel: d.nome_responsavel || undefined,
              email_contato: d.email_contato || undefined,
            }))} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome da Empresa</label>
                <input {...register('nome_empresa')} className="input" placeholder="Loja do João" />
                {errors.nome_empresa && <p className="text-red-500 text-xs mt-0.5">{errors.nome_empresa.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Slug (URL)</label>
                <input {...register('slug')} className="input" placeholder="loja-do-joao" />
                {errors.slug && <p className="text-red-500 text-xs mt-0.5">{errors.slug.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ</label>
                  <input {...register('cnpj')} className="input" placeholder="12.345.678/0001-90" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
                  <input {...register('telefone')} className="input" placeholder="(41) 99999-9999" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome do Responsável</label>
                  <input {...register('nome_responsavel')} className="input" placeholder="João Silva" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">E-mail de Contato</label>
                  <input {...register('email_contato')} className="input" placeholder="contato@lojajoao.com" />
                  {errors.email_contato && <p className="text-red-500 text-xs mt-0.5">{errors.email_contato.message}</p>}
                </div>
              </div>
              <hr className="border-gray-100" />
              <p className="text-xs text-gray-500 font-medium">Admin do Lojista</p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
                <input {...register('admin_nome')} className="input" placeholder="João Silva" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
                <input {...register('admin_email')} type="email" className="input" placeholder="joao@empresa.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Senha inicial</label>
                <input {...register('admin_password')} type="password" className="input" placeholder="••••••••" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setModalOpen(false); reset(); }} className="btn-outline flex-1">Cancelar</button>
                <button type="submit" disabled={create.isPending} className="btn-primary flex-1">
                  {create.isPending ? 'Criando...' : 'Criar Lojista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
