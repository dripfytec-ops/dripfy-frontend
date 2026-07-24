'use client';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, Check, KeyRound, Copy } from 'lucide-react';
import api from '@/lib/api';
import { BmToken } from '@/types';

function maskToken(token: string) {
  if (token.length <= 10) return '••••••••';
  return `${token.slice(0, 6)}••••••••${token.slice(-4)}`;
}

export default function BmTokensSection() {
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
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tokens Meta (Business Manager)</h2>
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
