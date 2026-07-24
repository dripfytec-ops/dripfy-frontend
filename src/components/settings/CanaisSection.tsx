'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Radio } from 'lucide-react';
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

export default function CanaisSection() {
  const queryClient = useQueryClient();
  const { data: canais = [], isLoading } = useCanaisDM();
  const { data: status = [] } = useStatusCanaisDM();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [bmNome, setBmNome] = useState('');
  const [loteSize, setLoteSize] = useState('');
  const [delayMs, setDelayMs] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function limparForm() {
    setNome(''); setWabaId(''); setPhoneNumberId(''); setAccessToken(''); setBmNome('');
    setLoteSize(''); setDelayMs('');
    setEditingId(null);
    setMostrarForm(false);
  }

  function abrirEdicao(c: CanalDM) {
    setEditingId(c.id);
    setNome(c.nome); setWabaId(c.waba_id); setPhoneNumberId(c.phone_number_id);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Canais WhatsApp</h2>
        {!mostrarForm && (
          <button onClick={() => setMostrarForm(true)} className="btn-primary-sm flex items-center gap-1.5">
            <Plus size={13} /> Novo canal
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-3">Números oficiais da Meta usados no Disparo Próprio — a seleção na hora de criar uma campanha fica em Disparo em Massa.</p>

      {isLoading ? (
        <p className="text-sm text-gray-400 text-center py-3">Carregando…</p>
      ) : canais.length === 0 && !mostrarForm ? (
        <div className="card p-8 text-center border-dashed">
          <Radio size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 text-sm font-medium">Nenhum canal cadastrado</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {canais.map((c) => {
            const s = status.find((x) => x.canal_id === c.id);
            return (
              <div key={c.id} className="card p-3 border-l-4 border-l-blue-300 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-gray-800">{c.nome}</p>
                    <BadgeQualidade rating={s?.quality_rating ?? null} />
                  </div>
                  <p className="text-xs text-gray-400">WABA: {c.waba_id} · Phone: {c.phone_number_id}</p>
                  <p className="text-xs text-gray-400">BM: {c.bm_nome || '—'}</p>
                  <p className="text-xs text-gray-400">Lote: {c.lote_size ?? 10} a cada {c.delay_ms ?? 300}ms</p>
                  {s && !s.erro && (
                    <p className="text-xs text-gray-400">
                      Custo 30d: {s.moeda} {(s.custo_30d ?? 0).toFixed(2)} ({(s.volume_30d ?? 0).toLocaleString('pt-BR')} msgs · {s.moeda} {(s.custo_medio ?? 0).toFixed(4)}/msg)
                    </p>
                  )}
                  {s?.erro && <p className="text-xs text-red-500">Erro ao consultar: {s.erro}</p>}
                </div>
                <button onClick={() => abrirEdicao(c)} title="Editar" className="text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg p-1.5 shrink-0 transition-colors">
                  <Pencil size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {mostrarForm && (
        <div className="card p-4 mt-2 space-y-3">
          <p className="text-xs font-medium text-gray-500">{editingId ? 'Editando canal' : 'Novo canal'}</p>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Nome do Canal</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Vendas, Suporte..." className="input" />
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
      )}
    </div>
  );
}
