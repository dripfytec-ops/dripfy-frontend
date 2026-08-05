'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Radio, X, Copy, MessageCircle, ArrowLeft } from 'lucide-react';
import { useCanaisDM, useStatusCanaisDM, createCanalDM, updateCanalDM } from '@/lib/dm-api';
import { CanalDM } from '@/types';

const QUALIDADE_LABEL: Record<string, string> = { GREEN: 'Alta', YELLOW: 'Média', RED: 'Baixa' };
const QUALIDADE_CLASS: Record<string, string> = {
  GREEN: 'bg-emerald-100 text-emerald-700',
  YELLOW: 'bg-amber-100 text-amber-700',
  RED: 'bg-red-100 text-red-700',
};

function BadgeQualidade({ rating }: { rating: string | null }) {
  if (!rating) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">Qualidade —</span>;
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${QUALIDADE_CLASS[rating] || 'bg-gray-100 text-gray-400'}`}>
      {QUALIDADE_LABEL[rating] || rating}
    </span>
  );
}

const STATUS_CONTA_LABEL: Record<string, string> = {
  CONNECTED: 'Conectada',
  RESTRICTED: 'Conta Restrita',
  FLAGGED: 'Sinalizada',
  RATE_LIMITED: 'Limitada',
  BANNED: 'Banida',
  PENDING: 'Pendente',
  DISCONNECTED: 'Desconectada',
};
const STATUS_CONTA_CLASS: Record<string, string> = {
  CONNECTED: 'bg-emerald-100 text-emerald-700',
  RESTRICTED: 'bg-red-100 text-red-700',
  FLAGGED: 'bg-red-100 text-red-700',
  RATE_LIMITED: 'bg-amber-100 text-amber-700',
  BANNED: 'bg-red-100 text-red-700',
  PENDING: 'bg-amber-100 text-amber-700',
  DISCONNECTED: 'bg-gray-100 text-gray-500',
};

function BadgeStatusConta({ status }: { status: string | null }) {
  if (!status) return null;
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUS_CONTA_CLASS[status] || 'bg-gray-100 text-gray-500'}`}>
      {STATUS_CONTA_LABEL[status] || status}
    </span>
  );
}

function copiar(valor: string, rotulo: string) {
  navigator.clipboard.writeText(valor).then(() => toast.success(`${rotulo} copiado!`));
}

function CampoCopiavel({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 font-mono truncate">{valor}</p>
      </div>
      <button
        onClick={() => copiar(valor, label)}
        title={`Copiar ${label}`}
        className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors shrink-0"
      >
        <Copy size={13} />
      </button>
    </div>
  );
}

// ── Detalhes de um canal, inline na mesma tela (mestre-detalhe: lista à esquerda, dados à direita) ──
function DetalhesCanalInline({
  canais, status, selecionadoId, onSelecionar, onEditar, onVoltar,
}: {
  canais: CanalDM[];
  status: ReturnType<typeof useStatusCanaisDM>['data'];
  selecionadoId: string;
  onSelecionar: (id: string) => void;
  onEditar: (c: CanalDM) => void;
  onVoltar: () => void;
}) {
  const canal = canais.find((c) => c.id === selecionadoId);
  const s = status?.find((x) => x.canal_id === selecionadoId);

  return (
    <div className="card overflow-hidden flex" style={{ height: '520px' }}>
      {/* Lista à esquerda */}
      <div className="w-56 shrink-0 border-r border-gray-100 flex flex-col">
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <button onClick={onVoltar} title="Voltar" className="p-1 -ml-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <ArrowLeft size={15} />
          </button>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Contas do WhatsApp</h3>
            <p className="text-[11px] text-gray-400">Selecione pra ver os dados</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {canais.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelecionar(c.id)}
              className={`w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 transition-colors ${
                c.id === selecionadoId ? 'bg-blue-50 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {c.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Dados à direita */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Detalhes do canal</h3>
          {canal && (
            <button
              onClick={() => onEditar(canal)}
              title="Editar canal"
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>

        {!canal ? (
          <p className="text-sm text-gray-400 text-center py-10">Selecione um canal.</p>
        ) : (
          <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <MessageCircle size={20} className="text-white" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{canal.nome}</p>
                  <p className="text-xs text-gray-400">{canal.telefone || s?.display_phone_number || 'Número não informado'}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <BadgeQualidade rating={s?.quality_rating ?? null} />
                  <BadgeStatusConta status={s?.account_status ?? null} />
                </div>
              </div>

              {s?.account_status && ['RESTRICTED', 'FLAGGED', 'BANNED'].includes(s.account_status) && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-sm font-medium">
                  {STATUS_CONTA_LABEL[s.account_status] || s.account_status}: essa conta está com restrição da Meta e pode não conseguir enviar mensagens normalmente.
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Dados do Canal</p>
                <div className="divide-y divide-gray-50">
                  <CampoCopiavel label="WABA ID" valor={canal.waba_id} />
                  <CampoCopiavel label="Phone Number ID" valor={canal.phone_number_id} />
                  <div className="py-1.5">
                    <p className="text-[11px] text-gray-400">Token</p>
                    <p className="text-sm text-gray-500 font-mono">{canal.token_preview}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Últimos 30 dias</p>
                {s && !s.erro ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-lg font-bold text-gray-800">{(s.volume_30d ?? 0).toLocaleString('pt-BR')}</p>
                      <p className="text-[11px] text-gray-400">Disparos</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-lg font-bold text-gray-800">
                        {s.moeda === 'USD' ? '$' : s.moeda} {(s.custo_30d ?? 0).toFixed(2)}
                        {s.custo_30d_brl != null && (
                          <span className="text-xs font-normal text-gray-400"> (≈ R$ {s.custo_30d_brl.toFixed(2)})</span>
                        )}
                      </p>
                      <p className="text-[11px] text-gray-400">Valor gasto</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-lg font-bold text-gray-800">
                        {s.moeda === 'USD' ? '$' : s.moeda} {(s.custo_medio ?? 0).toFixed(4)}
                      </p>
                      <p className="text-[11px] text-gray-400">Custo médio/msg</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-lg font-bold text-gray-800">{s.throughput_level || '—'}</p>
                      <p className="text-[11px] text-gray-400">Throughput</p>
                    </div>
                  </div>
                ) : s?.erro ? (
                  <p className="text-xs text-red-500">Erro ao consultar: {s.erro}</p>
                ) : (
                  <p className="text-xs text-gray-400">Carregando…</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
  );
}

export default function CanaisSection() {
  const queryClient = useQueryClient();
  const { data: canais = [], isLoading } = useCanaisDM();
  const { data: status = [] } = useStatusCanaisDM();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [bmNome, setBmNome] = useState('');
  const [loteSize, setLoteSize] = useState('');
  const [delayMs, setDelayMs] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [detalheId, setDetalheId] = useState<string | null>(null);

  function limparForm() {
    setNome(''); setTelefone(''); setWabaId(''); setPhoneNumberId(''); setAccessToken(''); setBmNome('');
    setLoteSize(''); setDelayMs('');
    setEditingId(null);
    setMostrarForm(false);
  }

  function abrirEdicao(c: CanalDM) {
    setDetalheId(null);
    setEditingId(c.id);
    setNome(c.nome); setTelefone(c.telefone || ''); setWabaId(c.waba_id); setPhoneNumberId(c.phone_number_id);
    setAccessToken(''); setBmNome(c.bm_nome || '');
    setLoteSize(c.lote_size ? String(c.lote_size) : ''); setDelayMs(c.delay_ms ? String(c.delay_ms) : '');
    setMostrarForm(true);
  }

  async function handleSave() {
    if (!nome || !wabaId || !phoneNumberId || (!editingId && !accessToken)) {
      setError('Preencha todos os campos.'); return;
    }
    setError(''); setSaving(true);
    try {
      const extras = {
        telefone: telefone || undefined,
        bm_nome: bmNome,
        lote_size: loteSize ? Number(loteSize) : undefined,
        delay_ms: delayMs ? Number(delayMs) : undefined,
      };
      if (editingId) {
        await updateCanalDM(editingId, {
          nome, waba_id: wabaId, phone_number_id: phoneNumberId, ...extras,
          ...(accessToken ? { access_token: accessToken } : {}),
        });
      } else {
        await createCanalDM({ nome, waba_id: wabaId, phone_number_id: phoneNumberId, access_token: accessToken, ...extras });
      }
      await queryClient.invalidateQueries({ queryKey: ['dm-canais'] });
      toast.success(editingId ? 'Canal atualizado!' : 'Canal cadastrado!');
      limparForm();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  const formulario = (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Nome do Canal</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Vendas, Suporte..." className="input" />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Número do WhatsApp</label>
        <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Ex: +55 71 99999-9999" className="input" />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">BM (Business Manager)</label>
        <input value={bmNome} onChange={(e) => setBmNome(e.target.value)} placeholder="Ex: Minha Empresa Matriz" className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Mensagens por lote</label>
          <input value={loteSize} onChange={(e) => setLoteSize(e.target.value)} type="number" min={1} placeholder="10 (padrão)" className="input" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Intervalo entre lotes (ms)</label>
          <input value={delayMs} onChange={(e) => setDelayMs(e.target.value)} type="number" min={0} placeholder="300 (padrão)" className="input" />
        </div>
      </div>
      <p className="text-[11px] text-gray-400 -mt-1.5">Deixe em branco pra usar o padrão (10 msgs a cada 300ms ≈ 33/s). BMs com tier maior (10K/24h) aguentam lote maior sem afetar os outros canais.</p>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">WABA ID</label>
        <input value={wabaId} onChange={(e) => setWabaId(e.target.value)} placeholder="Identificação da conta WhatsApp Business" className="input" />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Phone Number ID</label>
        <input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="Identificação do perfil do telefone" className="input" />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Access Token</label>
        <input value={accessToken} onChange={(e) => setAccessToken(e.target.value)} type="password"
          placeholder={editingId ? 'Deixe em branco para manter o token atual' : 'Token de acesso permanente'} className="input" />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button onClick={limparForm} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">Cancelar</button>
        <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium disabled:opacity-60">
          {saving ? 'Salvando…' : editingId ? 'Salvar Alterações' : 'Salvar Canal'}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contas do WhatsApp</h2>
        <button onClick={() => setMostrarForm(true)} className="btn-primary-sm flex items-center gap-1.5">
          <Plus size={13} /> Novo canal
        </button>
      </div>
      <p className="text-xs text-gray-400 mb-3">Números oficiais da Meta usados no Disparo Próprio — a seleção na hora de criar uma campanha fica em Disparo em Massa.</p>

      {detalheId ? (
        <DetalhesCanalInline
          canais={canais}
          status={status}
          selecionadoId={detalheId}
          onSelecionar={setDetalheId}
          onEditar={abrirEdicao}
          onVoltar={() => setDetalheId(null)}
        />
      ) : isLoading ? (
        <p className="text-sm text-gray-400 text-center py-3">Carregando…</p>
      ) : canais.length === 0 ? (
        <div className="card p-8 text-center border-dashed">
          <Radio size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 text-sm font-medium">Nenhum canal cadastrado</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-2.5 font-medium">Contas do WhatsApp</th>
                <th className="text-left px-4 py-2.5 font-medium">Classificação de qualidade</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {canais.map((c) => {
                const s = status.find((x) => x.canal_id === c.id);
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-gray-800 font-medium">{c.nome}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <BadgeQualidade rating={s?.quality_rating ?? null} />
                        <BadgeStatusConta status={s?.account_status && s.account_status !== 'CONNECTED' ? s.account_status : null} />
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => setDetalheId(c.id)} className="text-primary hover:underline text-xs font-medium">
                        detalhes
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-800">{editingId ? 'Editando canal' : 'Novo canal'}</p>
              <button onClick={limparForm} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X size={16} /></button>
            </div>
            {formulario}
          </div>
        </div>
      )}
    </div>
  );
}
