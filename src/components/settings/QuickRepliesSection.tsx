'use client';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, Check, Zap } from 'lucide-react';
import api from '@/lib/api';
import { QuickReply } from '@/types';

export default function QuickRepliesSection() {
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
    <div>
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
