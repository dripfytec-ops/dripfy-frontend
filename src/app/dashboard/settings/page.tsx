'use client';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Wifi, Plus, Pencil, Trash2, X, Radio, Tag, Check, KeyRound, Copy, Zap } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { BmToken, Etiqueta, QuickReply } from '@/types';

function EtiquetasSection() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editCor, setEditCor] = useState('#6B7280');
  const [adding, setAdding] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newCor, setNewCor] = useState('#8B5CF6');
  const addInputRef = useRef<HTMLInputElement>(null);

  const { data: etiquetas = [] } = useQuery<Etiqueta[]>({
    queryKey: ['etiquetas'],
    queryFn: async () => (await api.get('/etiquetas')).data,
  });

  useEffect(() => {
    if (adding) addInputRef.current?.focus();
  }, [adding]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['etiquetas'] });
    queryClient.invalidateQueries({ queryKey: ['leads'] });
  };

  const updateEtiqueta = useMutation({
    mutationFn: ({ id, nome, cor_hexadecimal }: { id: string; nome: string; cor_hexadecimal: string }) =>
      api.patch(`/etiquetas/${id}`, { nome, cor_hexadecimal }),
    onSuccess: () => { invalidate(); toast.success('Etiqueta atualizada!'); setEditingId(null); },
    onError: () => toast.error('Erro ao atualizar etiqueta.'),
  });

  const createEtiqueta = useMutation({
    mutationFn: ({ nome, cor_hexadecimal }: { nome: string; cor_hexadecimal: string }) =>
      api.post('/etiquetas', { nome, cor_hexadecimal }),
    onSuccess: () => { invalidate(); toast.success('Etiqueta criada!'); setAdding(false); setNewNome(''); setNewCor('#8B5CF6'); },
    onError: () => toast.error('Erro ao criar etiqueta.'),
  });

  const deleteEtiqueta = useMutation({
    mutationFn: (id: string) => api.delete(`/etiquetas/${id}`),
    onSuccess: () => { invalidate(); toast.success('Etiqueta removida.'); },
    onError: () => toast.error('Não foi possível remover a etiqueta.'),
  });

  const startEdit = (etiqueta: Etiqueta) => {
    setEditingId(etiqueta.id);
    setEditNome(etiqueta.nome);
    setEditCor(etiqueta.cor_hexadecimal);
  };

  const isSystem = (slug?: string) => slug === 'disparados' || slug === 'responderam';

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Etiquetas (Status dos Leads)</h2>
        <button onClick={() => setAdding(true)} className="btn-primary-sm flex items-center gap-1.5">
          <Plus size={13} /> Adicionar Etiqueta
        </button>
      </div>

      {etiquetas.length === 0 ? (
        <div className="card p-8 text-center border-dashed">
          <Tag size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 text-sm font-medium">Nenhuma etiqueta configurada</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {etiquetas.map((etiqueta) => (
            <div key={etiqueta.id} className="card p-3 border-l-4" style={{ borderLeftColor: etiqueta.cor_hexadecimal }}>
              {editingId === etiqueta.id ? (
                <div className="flex items-center gap-2">
                  <input type="color" value={editCor} onChange={(e) => setEditCor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 flex-shrink-0" />
                  <input
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    className="input flex-1"
                    autoFocus
                  />
                  <button
                    onClick={() => updateEtiqueta.mutate({ id: etiqueta.id, nome: editNome, cor_hexadecimal: editCor })}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                  >
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: etiqueta.cor_hexadecimal }} />
                    <p className="font-medium text-gray-900 text-sm truncate">{etiqueta.nome}</p>
                    {isSystem(etiqueta.slug) && (
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">sistema</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(etiqueta)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors">
                      <Pencil size={14} />
                    </button>
                    {!isSystem(etiqueta.slug) && (
                      <button
                        onClick={() => { if (confirm('Remover esta etiqueta? Os leads ficam sem etiqueta.')) deleteEtiqueta.mutate(etiqueta.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="card p-3 mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <input type="color" value={newCor} onChange={(e) => setNewCor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 flex-shrink-0" />
            <input
              ref={addInputRef}
              value={newNome}
              onChange={(e) => setNewNome(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && newNome.trim()) createEtiqueta.mutate({ nome: newNome.trim(), cor_hexadecimal: newCor }); if (e.key === 'Escape') setAdding(false); }}
              placeholder="Nome da etiqueta..."
              className="input flex-1"
            />
            <button
              onClick={() => newNome.trim() && createEtiqueta.mutate({ nome: newNome.trim(), cor_hexadecimal: newCor })}
              disabled={!newNome.trim() || createEtiqueta.isPending}
              className="btn-primary-sm"
            >
              Criar
            </button>
            <button onClick={() => setAdding(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickRepliesSection() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editTexto, setEditTexto] = useState('');
  const [adding, setAdding] = useState(false);
  const [newTitulo, setNewTitulo] = useState('');
  const [newTexto, setNewTexto] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  const { data: quickReplies = [] } = useQuery<QuickReply[]>({
    queryKey: ['quick-replies'],
    queryFn: async () => (await api.get('/quick-replies')).data,
  });

  useEffect(() => {
    if (adding) addInputRef.current?.focus();
  }, [adding]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['quick-replies'] });

  const updateReply = useMutation({
    mutationFn: ({ id, titulo, texto }: { id: string; titulo: string; texto: string }) =>
      api.patch(`/quick-replies/${id}`, { titulo, texto }),
    onSuccess: () => { invalidate(); toast.success('Resposta rápida atualizada!'); setEditingId(null); },
    onError: () => toast.error('Erro ao atualizar resposta rápida.'),
  });

  const createReply = useMutation({
    mutationFn: ({ titulo, texto }: { titulo: string; texto: string }) => api.post('/quick-replies', { titulo, texto }),
    onSuccess: () => { invalidate(); toast.success('Resposta rápida criada!'); setAdding(false); setNewTitulo(''); setNewTexto(''); },
    onError: () => toast.error('Erro ao criar resposta rápida.'),
  });

  const deleteReply = useMutation({
    mutationFn: (id: string) => api.delete(`/quick-replies/${id}`),
    onSuccess: () => { invalidate(); toast.success('Resposta rápida removida.'); },
    onError: () => toast.error('Não foi possível remover a resposta rápida.'),
  });

  const startEdit = (qr: QuickReply) => {
    setEditingId(qr.id);
    setEditTitulo(qr.titulo);
    setEditTexto(qr.texto);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Respostas Rápidas</h2>
        <button onClick={() => setAdding(true)} className="btn-primary-sm flex items-center gap-1.5">
          <Plus size={13} /> Adicionar Resposta
        </button>
      </div>
      <p className="text-xs text-gray-400 mb-3">Atalhos de texto disponíveis pra toda a equipe no campo de mensagem do Chat.</p>

      {quickReplies.length === 0 && !adding ? (
        <div className="card p-8 text-center border-dashed">
          <Zap size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 text-sm font-medium">Nenhuma resposta rápida cadastrada</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {quickReplies.map((qr) => (
            <div key={qr.id} className="card p-3 border-l-4 border-l-amber-300">
              {editingId === qr.id ? (
                <div className="space-y-2">
                  <input
                    value={editTitulo}
                    onChange={(e) => setEditTitulo(e.target.value)}
                    placeholder="Título (ex: Saudação)..."
                    className="input"
                    autoFocus
                  />
                  <textarea
                    value={editTexto}
                    onChange={(e) => setEditTexto(e.target.value)}
                    placeholder="Texto da resposta..."
                    rows={2}
                    className="input"
                  />
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => updateReply.mutate({ id: qr.id, titulo: editTitulo, texto: editTexto })}
                      disabled={!editTitulo.trim() || !editTexto.trim()}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                    >
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 flex-shrink-0">
                      <Zap size={14} className="text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{qr.titulo}</p>
                      <p className="text-xs text-gray-400 truncate">{qr.texto}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(qr)} title="Editar" className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Remover a resposta rápida "${qr.titulo}"?`)) deleteReply.mutate(qr.id); }}
                      title="Remover"
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="card p-3 mt-2 space-y-2">
          <input
            ref={addInputRef}
            value={newTitulo}
            onChange={(e) => setNewTitulo(e.target.value)}
            placeholder="Título (ex: Saudação)..."
            className="input"
          />
          <textarea
            value={newTexto}
            onChange={(e) => setNewTexto(e.target.value)}
            placeholder="Texto da resposta..."
            rows={2}
            className="input"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => newTitulo.trim() && newTexto.trim() && createReply.mutate({ titulo: newTitulo.trim(), texto: newTexto.trim() })}
              disabled={!newTitulo.trim() || !newTexto.trim() || createReply.isPending}
              className="btn-primary-sm"
            >
              Salvar
            </button>
            <button onClick={() => setAdding(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function maskToken(token: string) {
  if (token.length <= 10) return '••••••••';
  return `${token.slice(0, 6)}••••••••${token.slice(-4)}`;
}

function BmTokensSection() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editToken, setEditToken] = useState('');
  const [adding, setAdding] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newToken, setNewToken] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  const { data: bmTokens = [] } = useQuery<BmToken[]>({
    queryKey: ['bm-tokens'],
    queryFn: async () => (await api.get('/bm-tokens')).data,
  });

  useEffect(() => {
    if (adding) addInputRef.current?.focus();
  }, [adding]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['bm-tokens'] });

  const updateToken = useMutation({
    mutationFn: ({ id, nome, token }: { id: string; nome: string; token: string }) =>
      api.patch(`/bm-tokens/${id}`, { nome, token }),
    onSuccess: () => { invalidate(); toast.success('Token atualizado!'); setEditingId(null); },
    onError: () => toast.error('Erro ao atualizar token.'),
  });

  const createToken = useMutation({
    mutationFn: ({ nome, token }: { nome: string; token: string }) => api.post('/bm-tokens', { nome, token }),
    onSuccess: () => { invalidate(); toast.success('Token salvo!'); setAdding(false); setNewNome(''); setNewToken(''); },
    onError: () => toast.error('Erro ao salvar token.'),
  });

  const deleteToken = useMutation({
    mutationFn: (id: string) => api.delete(`/bm-tokens/${id}`),
    onSuccess: () => { invalidate(); toast.success('Token removido.'); },
    onError: () => toast.error('Não foi possível remover o token.'),
  });

  const startEdit = (bm: BmToken) => {
    setEditingId(bm.id);
    setEditNome(bm.nome);
    setEditToken(bm.token);
  };

  const copyToken = async (token: string) => {
    await navigator.clipboard.writeText(token);
    toast.success('Token copiado!');
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tokens de BM (Business Manager)</h2>
        <button onClick={() => setAdding(true)} className="btn-primary-sm flex items-center gap-1.5">
          <Plus size={13} /> Adicionar Token
        </button>
      </div>
      <p className="text-xs text-gray-400 mb-3">Guarde aqui o token de sistema de cada BM da Meta para consultar na hora de configurar um canal.</p>

      {bmTokens.length === 0 && !adding ? (
        <div className="card p-8 text-center border-dashed">
          <KeyRound size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 text-sm font-medium">Nenhum token de BM salvo</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {bmTokens.map((bm) => (
            <div key={bm.id} className="card p-3 border-l-4 border-l-indigo-300">
              {editingId === bm.id ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    placeholder="Nome do BM..."
                    className="input flex-1"
                    autoFocus
                  />
                  <input
                    value={editToken}
                    onChange={(e) => setEditToken(e.target.value)}
                    placeholder="Token..."
                    className="input flex-1 font-mono"
                  />
                  <button
                    onClick={() => updateToken.mutate({ id: bm.id, nome: editNome, token: editToken })}
                    disabled={!editNome.trim() || !editToken.trim()}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                  >
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50 flex-shrink-0">
                      <KeyRound size={14} className="text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{bm.nome}</p>
                      <p className="text-xs text-gray-400 font-mono truncate">{maskToken(bm.token)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => copyToken(bm.token)} title="Copiar token" className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors">
                      <Copy size={14} />
                    </button>
                    <button onClick={() => startEdit(bm)} title="Editar" className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Remover o token do BM "${bm.nome}"?`)) deleteToken.mutate(bm.id); }}
                      title="Remover"
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="card p-3 mt-2 space-y-2">
          <input
            ref={addInputRef}
            value={newNome}
            onChange={(e) => setNewNome(e.target.value)}
            placeholder="Nome do BM (ex: CredPix)..."
            className="input"
          />
          <input
            value={newToken}
            onChange={(e) => setNewToken(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newNome.trim() && newToken.trim()) createToken.mutate({ nome: newNome.trim(), token: newToken.trim() });
              if (e.key === 'Escape') setAdding(false);
            }}
            placeholder="Token do sistema (EAA...)..."
            className="input font-mono"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => newNome.trim() && newToken.trim() && createToken.mutate({ nome: newNome.trim(), token: newToken.trim() })}
              disabled={!newNome.trim() || !newToken.trim() || createToken.isPending}
              className="btn-primary-sm"
            >
              Salvar
            </button>
            <button onClick={() => setAdding(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm mt-0.5">Etiquetas de leads e integrações</p>
      </div>

      {/* Canais WhatsApp — gerenciados na tela de Campanhas (Disparo em Massa) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Canais WhatsApp</h2>
        </div>
        <Link href="/dashboard/campaigns" className="card p-4 border-l-4 border-l-blue-300 flex items-center justify-between hover:border-l-primary transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 flex-shrink-0">
              <Radio size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Gerenciar canais</p>
              <p className="text-xs text-gray-400 mt-0.5">Números oficiais, cadência de disparo e qualidade — na tela de Campanhas</p>
            </div>
          </div>
          <span className="text-xs text-primary font-medium group-hover:underline">Abrir →</span>
        </Link>
      </div>

      <BmTokensSection />

      <QuickRepliesSection />

      <EtiquetasSection />

      {/* Futuros canais */}
      <div className="card p-4 bg-slate-50 border-dashed">
        <div className="flex items-center gap-2 text-slate-400">
          <Wifi size={16} />
          <p className="text-sm">Mais canais em breve: Instagram DM, Telegram, Email</p>
        </div>
      </div>
    </div>
  );
}
