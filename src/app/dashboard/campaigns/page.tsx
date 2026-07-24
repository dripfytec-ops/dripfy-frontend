'use client';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';
import { X, Plus, Radio, Pause, Play, Pencil, ArrowLeft, Building2, Sparkles, Clock } from 'lucide-react';
import api from '@/lib/api';
import {
  useCanaisDM, useCampanhasDM, useCampanhaDM, useStatusCanaisDM,
  createCanalDM, updateCanalDM, createCampanhaDM, iniciarDisparoDM, pausarCampanhaDM,
  fetchTemplatesDM,
} from '@/lib/dm-api';
import { CanalDM, TemplateDM, StatusCampanhaDM, Vendedor } from '@/types';

function formatarDataHora(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

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

const statusConfig: Record<StatusCampanhaDM, { label: string; className: string }> = {
  rascunho: { label: 'Rascunho', className: 'bg-gray-100 text-gray-600' },
  agendada: { label: 'Agendada', className: 'bg-blue-100 text-blue-700' },
  em_andamento: { label: 'Em Andamento', className: 'bg-yellow-100 text-yellow-700' },
  concluida: { label: 'Concluída', className: 'bg-green-100 text-green-700' },
  pausada: { label: 'Pausada', className: 'bg-red-100 text-red-700' },
};

interface ContatoCSV {
  nome: string;
  telefone: string;
  cpf?: string;
}

// ── Modal: gerenciar canais ─────────────────────────────────────────────────
function CanaisModal({ onClose }: { onClose: () => void }) {
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
      limparForm();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">Canais (números oficiais)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-4 space-y-3 max-h-[75vh] overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-gray-400 text-center py-3">Carregando…</p>
          ) : (
            <div className="space-y-2">
              {canais.map((c) => {
                const s = status.find((x) => x.canal_id === c.id);
                return (
                  <div key={c.id} className="bg-gray-50 rounded-lg px-3 py-2.5 flex items-start justify-between gap-2">
                    <div>
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
                    <button onClick={() => abrirEdicao(c)} className="text-gray-400 hover:text-blue-600 shrink-0 p-1">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              {canais.length === 0 && <p className="text-sm text-gray-400 text-center py-3">Nenhum canal cadastrado.</p>}
            </div>
          )}

          {mostrarForm ? (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-xs font-medium text-gray-500">{editingId ? 'Editando canal' : 'Novo canal'}</p>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nome do Canal</label>
                <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Vendas, Suporte..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">BM (Business Manager)</label>
                <input value={bmNome} onChange={(e) => setBmNome(e.target.value)} placeholder="Ex: Minha Empresa Matriz"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Mensagens por lote</label>
                  <input value={loteSize} onChange={(e) => setLoteSize(e.target.value)} type="number" min={1} placeholder="10 (padrão)"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Intervalo entre lotes (ms)</label>
                  <input value={delayMs} onChange={(e) => setDelayMs(e.target.value)} type="number" min={0} placeholder="300 (padrão)"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              </div>
              <p className="text-[11px] text-gray-400 -mt-1.5">Deixe em branco pra usar o padrão (10 msgs a cada 300ms ≈ 33/s). BMs com tier maior (10K/24h) aguentam lote maior sem afetar os outros canais.</p>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">WABA ID</label>
                <input value={wabaId} onChange={(e) => setWabaId(e.target.value)} placeholder="Identificação da conta WhatsApp Business"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Phone Number ID</label>
                <input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="Identificação do perfil do telefone"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Access Token</label>
                <input value={accessToken} onChange={(e) => setAccessToken(e.target.value)} type="password"
                  placeholder={editingId ? 'Deixe em branco para manter o token atual' : 'Token de acesso permanente'}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2">
                <button onClick={limparForm} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium disabled:opacity-60">
                  {saving ? 'Salvando…' : editingId ? 'Salvar Alterações' : 'Salvar Canal'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setMostrarForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Novo canal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal: nova campanha ────────────────────────────────────────────────────
function NovaCampanhaModal({ canais, onClose, onCreated }: {
  canais: CanalDM[]; onClose: () => void; onCreated: (id: string) => void;
}) {
  const [canalId, setCanalId] = useState<string>(canais[0]?.id ?? '');
  const [templates, setTemplates] = useState<TemplateDM[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [nome, setNome] = useState('');
  const [templateSelecionado, setTemplateSelecionado] = useState('');
  const [headerImageUrl, setHeaderImageUrl] = useState('');
  const [imagemComErro, setImagemComErro] = useState(false);
  const [contatos, setContatos] = useState<ContatoCSV[]>([]);
  const [agendarPara, setAgendarPara] = useState('');
  const [disparar, setDisparar] = useState<'imediato' | 'agendado'>('imediato');
  const [vendedorId, setVendedorId] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const { data: vendedores = [] } = useQuery<Vendedor[]>({
    queryKey: ['vendedores'],
    queryFn: async () => { try { return (await api.get('/leads/vendedores')).data; } catch { return []; } },
  });

  async function carregarTemplates(id: string) {
    setLoadingTemplates(true);
    setTemplateSelecionado(''); setHeaderImageUrl('');
    try {
      const data = await fetchTemplatesDM(id);
      setTemplates(data.filter((t) => t.status === 'APPROVED'));
    } catch {
      setTemplates([]);
    } finally { setLoadingTemplates(false); }
  }

  function handleCanalChange(id: string) {
    setCanalId(id);
    carregarTemplates(id);
  }

  function handleTemplateChange(name: string) {
    setTemplateSelecionado(name);
    setHeaderImageUrl('');
    setImagemComErro(false);
  }

  function handleHeaderImageUrlChange(url: string) {
    setHeaderImageUrl(url);
    setImagemComErro(false);
  }

  useEffect(() => {
    if (canalId) carregarTemplates(canalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const normalized = result.data.map((row) => {
          const entry: ContatoCSV = { nome: '', telefone: '' };
          for (const key of Object.keys(row)) {
            const k = key.trim().toLowerCase();
            const v = row[key]?.toString().trim() || '';
            if (!v) continue;
            if (['nome', 'nome completo'].includes(k)) entry.nome = v;
            else if (['telefone', 'fone', 'celular', 'whatsapp'].includes(k)) entry.telefone = v.replace(/\D/g, '');
            else if (k === 'cpf') entry.cpf = v.replace(/\D/g, '');
          }
          return entry;
        }).filter((c) => c.telefone);
        setContatos(normalized);
      },
    });
  }

  async function handleSubmit() {
    setErro('');
    if (!nome || !canalId || !templateSelecionado || contatos.length === 0) {
      setErro('Preencha todos os campos e faça upload do CSV.'); return;
    }
    setSalvando(true);
    try {
      const campanha = await createCampanhaDM({
        nome,
        canal_id: canalId,
        template_name: templateSelecionado,
        template_params: [],
        header_image_url: headerImageUrl || null,
        agendado_para: disparar === 'agendado' ? agendarPara : null,
        vendedor_id: vendedorId || null,
        contatos,
      });
      onCreated(campanha.id);
    } catch (e: any) {
      setErro(e?.response?.data?.message ?? 'Erro ao criar campanha');
    } finally { setSalvando(false); }
  }

  const templateAtual = templates.find((t) => t.name === templateSelecionado);
  const bodyTemplate = templateAtual?.components?.find((c) => c.type === 'BODY')?.text || '';
  const precisaImagem = templateAtual?.components?.some((c) => c.type === 'HEADER' && c.format === 'IMAGE');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">Nova Campanha</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Nome da Campanha</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Campanha Julho 2026"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Canal</label>
            <select value={canalId} onChange={(e) => handleCanalChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-300">
              {canais.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Template</label>
            {loadingTemplates ? (
              <p className="text-sm text-gray-400">Carregando templates…</p>
            ) : (
              <select value={templateSelecionado} onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-300">
                <option value="">Selecione um template</option>
                {templates.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            )}
            {bodyTemplate && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-gray-600 whitespace-pre-wrap">{bodyTemplate}</div>
            )}
          </div>

          {precisaImagem && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">URL da Imagem do Header <span className="text-red-400">*</span></label>
              <input value={headerImageUrl} onChange={(e) => handleHeaderImageUrlChange(e.target.value)} placeholder="https://exemplo.com/imagem.jpg"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-300" />
              {headerImageUrl && !imagemComErro && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={headerImageUrl} alt="Preview" className="mt-2 h-24 rounded-lg object-cover border border-gray-200"
                  onError={() => setImagemComErro(true)} />
              )}
              {headerImageUrl && imagemComErro && (
                <p className="mt-2 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  Não consegui carregar essa imagem. Confira se a URL é pública e aponta direto pro arquivo (jpg/png).
                </p>
              )}
            </div>
          )}

          {vendedores.length > 0 && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Vendedor exclusivo (opcional)</label>
              <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-300">
                <option value="">Nenhum — não atribuir automaticamente</option>
                {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">Todo contato gerado por essa campanha já nasce atribuído a esse vendedor no Chat.</p>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Lista de Contatos (CSV)</label>
            <p className="text-[11px] text-gray-400 mb-1.5">
              Obrigatórias: <b>nome</b> e <b>telefone</b> (com DDI, ex: 5541999999999). Opcional: <b>cpf</b> — aparece nos detalhes do contato no Chat.
            </p>
            <input type="file" accept=".csv" onChange={handleCSV}
              className="w-full text-sm text-gray-500 file:mr-3 file:bg-blue-500 file:text-white file:border-0 file:rounded-lg file:px-3 file:py-1.5 file:text-xs file:cursor-pointer" />
            {contatos.length > 0 && <p className="mt-1.5 text-sm text-green-600 font-medium">{contatos.length} contato(s) carregado(s)</p>}
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-2 block">Quando disparar?</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDisparar('imediato')}
                className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${disparar === 'imediato' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-200 text-gray-600'}`}>
                Imediato
              </button>
              <button type="button" onClick={() => setDisparar('agendado')}
                className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${disparar === 'agendado' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-200 text-gray-600'}`}>
                Agendar
              </button>
            </div>
            {disparar === 'agendado' && (
              <input type="datetime-local" value={agendarPara} onChange={(e) => setAgendarPara(e.target.value)}
                className="mt-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
            )}
          </div>

          {erro && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>}

          <button onClick={handleSubmit} disabled={salvando}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
            {salvando ? 'Criando…' : 'Criar Campanha'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: detalhe da campanha ──────────────────────────────────────────────
function CampanhaDetalheModal({ campanhaId, onClose }: { campanhaId: string; onClose: () => void }) {
  const { data: campanha, refetch } = useCampanhaDM(campanhaId);
  const [acting, setActing] = useState(false);

  async function disparar() {
    setActing(true);
    try { await iniciarDisparoDM(campanhaId); await refetch(); } finally { setActing(false); }
  }
  async function pausar() {
    setActing(true);
    try { await pausarCampanhaDM(campanhaId); await refetch(); } finally { setActing(false); }
  }

  if (!campanha) return null;

  const cfg = statusConfig[campanha.status] ?? statusConfig.rascunho;
  const progresso = campanha.total_contatos > 0
    ? Math.round(((campanha.enviados + campanha.falhas) / campanha.total_contatos) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">{campanha.nome}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cfg.className}`}>{cfg.label}</span>
              <span className="text-xs text-gray-400">Template: {campanha.template_name}</span>
              <span className="text-xs text-gray-400">Canal: {campanha.canal?.nome || '—'}</span>
              {campanha.vendedor?.nome && <span className="text-xs text-gray-400">Vendedor: {campanha.vendedor.nome}</span>}
              <span className="text-xs text-gray-400">Disparada em: {formatarDataHora(campanha.iniciado_em)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(campanha.status === 'rascunho' || campanha.status === 'pausada') && (
              <button onClick={disparar} disabled={acting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-xs font-medium rounded-lg transition-colors">
                <Play className="w-3.5 h-3.5" /> {campanha.status === 'pausada' ? 'Retomar' : 'Disparar'}
              </button>
            )}
            {campanha.status === 'em_andamento' && (
              <button onClick={pausar} disabled={acting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-medium rounded-lg transition-colors">
                <Pause className="w-3.5 h-3.5" /> Pausar
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-gray-800">{campanha.total_contatos}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Total</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-blue-500">{campanha.enviados}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Enviados</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-emerald-600">{campanha.entregues}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Entregues</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-red-500">{campanha.falhas}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Falhas</p>
            </div>
          </div>

          {(campanha.status === 'em_andamento') && (
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-500">Progresso</span>
                <span className="text-gray-800 font-medium">{progresso}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full">
                <div className="h-1.5 bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progresso}%` }} />
              </div>
            </div>
          )}

          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 text-xs text-gray-500 font-medium bg-gray-50">
              Contatos ({campanha.contatos.length})
            </div>
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {campanha.contatos.map((c) => (
                <div key={c.id} className="px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-800">{c.nome || '—'}</p>
                    <p className="text-xs text-gray-400">{c.telefone}</p>
                  </div>
                  <div>
                    {c.status === 'pendente' && <span className="text-xs text-gray-400">Pendente</span>}
                    {c.status === 'enviando' && <span className="text-xs text-yellow-600 font-medium">Enviando…</span>}
                    {c.status === 'enviado' && <span className="text-xs text-blue-500 font-medium">Enviado</span>}
                    {c.status === 'entregue' && <span className="text-xs text-emerald-600 font-medium">Entregue</span>}
                    {c.status === 'lido' && <span className="text-xs text-indigo-600 font-medium">Lido</span>}
                    {c.status === 'falha' && <span className="text-xs text-red-500 font-medium" title={c.erro || ''}>Falha</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Disparo Próprio: fluxo completo de hoje (canal/BM do próprio lojista) ──
function DisparoProprioView({ onVoltar }: { onVoltar: () => void }) {
  const { data: campanhas = [], isLoading } = useCampanhasDM();
  const { data: canais = [] } = useCanaisDM();
  const queryClient = useQueryClient();

  const [showCanais, setShowCanais] = useState(false);
  const [showNova, setShowNova] = useState(false);
  const [detalheId, setDetalheId] = useState<string | null>(null);

  return (
    <div className="p-6">
      {showCanais && <CanaisModal onClose={() => setShowCanais(false)} />}
      {showNova && (
        <NovaCampanhaModal
          canais={canais}
          onClose={() => setShowNova(false)}
          onCreated={(id) => {
            setShowNova(false);
            queryClient.invalidateQueries({ queryKey: ['dm-campanhas'] });
            setDetalheId(id);
          }}
        />
      )}
      {detalheId != null && <CampanhaDetalheModal campanhaId={detalheId} onClose={() => setDetalheId(null)} />}

      <button
        onClick={onVoltar}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-3 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-sm">Disparo Próprio — API Oficial WhatsApp</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{isLoading ? 'Carregando…' : `${campanhas.length} campanha(s)`}</span>
            <button onClick={() => setShowCanais(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-600 text-xs font-medium rounded-lg transition-colors">
              <Radio className="w-3 h-3" /> Canais
            </button>
            <button onClick={() => (canais.length === 0 ? setShowCanais(true) : setShowNova(true))}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg shadow-sm transition-colors">
              <Plus className="w-3 h-3" /> Nova Campanha
            </button>
          </div>
        </div>

        {canais.length === 0 && !isLoading && (
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 text-xs text-amber-700">
            Cadastre um canal (número oficial da Meta) antes de criar uma campanha.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Campanha</th>
                <th className="text-left px-5 py-3 font-medium">Canal</th>
                <th className="text-left px-5 py-3 font-medium">Disparada em</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Enviados / Total</th>
                <th className="text-right px-5 py-3 font-medium">Entregues</th>
                <th className="text-right px-5 py-3 font-medium">Falhas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400 text-sm">Carregando…</td></tr>
              )}
              {!isLoading && campanhas.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400 text-sm">Nenhuma campanha criada ainda.</td></tr>
              )}
              {!isLoading && campanhas.map((c) => {
                const cfg = statusConfig[c.status] ?? statusConfig.rascunho;
                return (
                  <tr key={c.id} onClick={() => setDetalheId(c.id)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {c.nome}
                      {c.vendedor?.nome && <span className="block text-[11px] font-normal text-gray-400">Vendedor: {c.vendedor.nome}</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{c.canal?.nome || '—'}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatarDataHora(c.iniciado_em)}</td>
                    <td className="px-5 py-3"><span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cfg.className}`}>{cfg.label}</span></td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700">{c.enviados}/{c.total_contatos}</td>
                    <td className="px-5 py-3 text-right font-mono text-emerald-600">{c.entregues}</td>
                    <td className="px-5 py-3 text-right font-mono">
                      {c.falhas > 0 ? <span className="text-red-500 font-semibold">{c.falhas}</span> : <span className="text-gray-300">0</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Disparo Dripfy: infraestrutura compartilhada da Dripfy (ainda não existe
// backend pra isso — placeholder até definirmos canal compartilhado/custo) ──
function DisparoDripfyView({ onVoltar }: { onVoltar: () => void }) {
  return (
    <div className="p-6">
      <button
        onClick={onVoltar}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-3 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar
      </button>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center text-center gap-3 max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
          <Clock className="w-6 h-6 text-amber-500" />
        </div>
        <h3 className="font-semibold text-gray-800">Disparo Dripfy — em breve</h3>
        <p className="text-sm text-gray-500">
          Dispare campanhas usando a infraestrutura da Dripfy, sem precisar cadastrar seu próprio
          número/Business Manager na Meta. Estamos finalizando essa opção.
        </p>
      </div>
    </div>
  );
}

// ── Página principal: escolha entre Disparo Próprio e Disparo Dripfy ───────
export default function DisparoMassaPage() {
  const [modo, setModo] = useState<'proprio' | 'dripfy' | null>(null);

  if (modo === 'proprio') return <DisparoProprioView onVoltar={() => setModo(null)} />;
  if (modo === 'dripfy') return <DisparoDripfyView onVoltar={() => setModo(null)} />;

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Disparo em Massa</h2>
      <p className="text-sm text-gray-500 mb-6">Escolha como você quer disparar suas campanhas.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setModo('proprio')}
          className="text-left bg-white rounded-2xl border border-gray-100 hover:border-blue-300 hover:shadow-sm transition-all p-5 flex flex-col gap-2"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="font-semibold text-gray-800 text-sm">Disparo Próprio</h3>
          <p className="text-xs text-gray-500">Use seu próprio número e Business Manager cadastrados na Meta.</p>
        </button>
        <button
          onClick={() => setModo('dripfy')}
          className="text-left bg-white rounded-2xl border border-gray-100 hover:border-amber-300 hover:shadow-sm transition-all p-5 flex flex-col gap-2 relative"
        >
          <span className="absolute top-3 right-3 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">Em breve</span>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="font-semibold text-gray-800 text-sm">Disparo Dripfy</h3>
          <p className="text-xs text-gray-500">Use a infraestrutura da Dripfy, sem precisar configurar seu próprio canal.</p>
        </button>
      </div>
    </div>
  );
}
