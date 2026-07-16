'use client';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save, MessageSquare, Wifi, Plus, Pencil, Trash2, X, Radio, Tag, Check } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Etiqueta } from '@/types';

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

export default function SettingsPage() {
  const [chatwootOpen, setChatwootOpen] = useState(false);
  const [chatwootForm, setChatwootForm] = useState({ chatwoot_url: '', chatwoot_api_token: '' });

  const { data: chatwootConfig } = useQuery({
    queryKey: ['chatwoot-config'],
    queryFn: async () => { try { return (await api.get('/chatwoot/config')).data; } catch { return null; } },
  });

  useEffect(() => {
    if (chatwootConfig) {
      setChatwootForm({ chatwoot_url: chatwootConfig.chatwoot_url || '', chatwoot_api_token: '' });
    }
  }, [chatwootConfig]);

  const saveChatwoot = useMutation({
    mutationFn: () => api.post('/chatwoot/config', chatwootForm),
    onSuccess: () => toast.success('Chatwoot salvo!'),
    onError: () => toast.error('Erro ao salvar Chatwoot.'),
  });

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

      <EtiquetasSection />

      {/* Chatwoot */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Chatwoot — Atendimento Humano</h2>
        </div>
        <div className={`card p-4 border-l-4 ${chatwootConfig?.chatwoot_url ? 'border-l-green-400' : 'border-l-gray-300'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${chatwootConfig?.chatwoot_url ? 'bg-purple-50' : 'bg-gray-100'}`}>
                <MessageSquare size={18} className={chatwootConfig?.chatwoot_url ? 'text-purple-600' : 'text-gray-400'} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Chatwoot</p>
                {chatwootConfig?.chatwoot_url
                  ? <p className="text-xs text-gray-500 mt-0.5">{chatwootConfig.chatwoot_url}</p>
                  : <p className="text-xs text-gray-400 mt-0.5">Não configurado</p>}
                <p className="text-xs text-gray-400 mt-1">URL compartilhada entre todos os canais. Cada canal usa seu próprio Inbox ID.</p>
              </div>
            </div>
            <button onClick={() => setChatwootOpen((v) => !v)} className="text-xs text-primary font-medium hover:underline">
              {chatwootOpen ? 'Fechar' : chatwootConfig?.chatwoot_url ? 'Editar' : 'Configurar'}
            </button>
          </div>
          {chatwootOpen && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">URL do Chatwoot</label>
                <input
                  value={chatwootForm.chatwoot_url}
                  onChange={(e) => setChatwootForm((p) => ({ ...p, chatwoot_url: e.target.value }))}
                  className="input"
                  placeholder="https://chatwoot.suaempresa.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">API Token</label>
                <input
                  type="password"
                  value={chatwootForm.chatwoot_api_token}
                  onChange={(e) => setChatwootForm((p) => ({ ...p, chatwoot_api_token: e.target.value }))}
                  className="input font-mono"
                  placeholder="••••••••"
                />
              </div>
              <button onClick={() => saveChatwoot.mutate()} disabled={saveChatwoot.isPending} className="btn-primary flex items-center gap-2 text-sm">
                <Save size={13} /> {saveChatwoot.isPending ? 'Salvando...' : 'Salvar Chatwoot'}
              </button>
            </div>
          )}
        </div>
      </div>

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
