'use client';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, Tag, Check } from 'lucide-react';
import api from '@/lib/api';
import { Etiqueta } from '@/types';

export default function EtiquetasSection() {
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
    <div>
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
