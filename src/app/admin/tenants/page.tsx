'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, X, Building2, Users, LayoutList, Settings,
  CheckCircle2, XCircle, KeyRound, Smartphone,
} from 'lucide-react';
import api from '@/lib/api';
import { Tenant } from '@/types';

const schema = z.object({
  nome_empresa: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
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

type TenantDetail = {
  id: string;
  nome_empresa: string;
  slug: string;
  status_assinatura: string;
  users: Array<{ id: string; nome: string; email: string; role: string; ativo: boolean }>;
  dm_canais: Array<{ id: string; nome: string; phone_number_id: string; ativo: boolean }>;
  _count: { leads: number; dm_campanhas: number };
};

export default function TenantsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [detailTenantId, setDetailTenantId] = useState<string | null>(null);
  const [resetingUserId, setResetingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const queryClient = useQueryClient();

  const { data: tenants = [], isLoading } = useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: async () => (await api.get('/tenants')).data,
  });

  const { data: tenantDetail, isLoading: detailLoading } = useQuery<TenantDetail>({
    queryKey: ['tenant-detail', detailTenantId],
    queryFn: async () => (await api.get(`/tenants/${detailTenantId}`)).data,
    enabled: !!detailTenantId,
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
      queryClient.invalidateQueries({ queryKey: ['tenant-detail', detailTenantId] });
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
      queryClient.invalidateQueries({ queryKey: ['tenant-detail', detailTenantId] });
    },
    onError: () => toast.error('Erro ao atualizar status.'),
  });

  const closeDetail = () => {
    setDetailTenantId(null);
    setResetingUserId(null);
    setNewPassword('');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lojistas</h1>
          <p className="text-gray-500 text-sm">Gerencie os tenants da plataforma</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo Lojista
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">
                  <Building2 size={20} className="text-brand" />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_BADGE[tenant.status_assinatura]}`}>
                  {tenant.status_assinatura}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900">{tenant.nome_empresa}</h3>
              <p className="text-gray-400 text-xs font-mono mt-0.5">/{tenant.slug}</p>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Users size={13} />
                  {tenant._count?.users || 0} usuários
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <LayoutList size={13} />
                  {tenant._count?.leads || 0} leads
                </div>
                <button
                  onClick={() => setDetailTenantId(tenant.id)}
                  className="ml-auto flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                >
                  <Settings size={12} /> Gerenciar
                </button>
              </div>
            </div>
          ))}
          {tenants.length === 0 && (
            <div className="col-span-3 card p-12 text-center text-gray-400">
              Nenhum lojista cadastrado ainda.
            </div>
          )}
        </div>
      )}

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
            <form onSubmit={handleSubmit((d) => create.mutate(d))} className="space-y-3">
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

      {/* Painel de Detalhes do Tenant */}
      {detailTenantId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">{tenantDetail?.nome_empresa || '...'}</h2>
                <p className="text-gray-400 text-xs font-mono">/{tenantDetail?.slug}</p>
              </div>
              <button onClick={closeDetail}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Status do Tenant */}
            {tenantDetail && (
              <div className="mb-5 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status da Assinatura</p>
                <div className="flex gap-2">
                  {(['trial', 'ativo', 'inativo'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateTenantStatus.mutate({ id: detailTenantId, status: s })}
                      disabled={updateTenantStatus.isPending}
                      className={`flex-1 text-xs py-1.5 rounded-lg font-medium border transition-colors ${
                        tenantDetail.status_assinatura === s
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Usuários */}
            <div className="mb-5">
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

            {/* Canais WhatsApp */}
            {tenantDetail && tenantDetail.dm_canais.length > 0 && (
              <div className="mb-5">
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

            {/* Stats */}
            {tenantDetail && (
              <div className="pt-4 border-t border-gray-100 flex gap-6">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">{tenantDetail._count.leads}</p>
                  <p className="text-xs text-gray-500">Leads</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">{tenantDetail._count.dm_campanhas}</p>
                  <p className="text-xs text-gray-500">Campanhas</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
