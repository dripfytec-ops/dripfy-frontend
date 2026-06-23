'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save, Eye, EyeOff, CheckCircle2, XCircle, MessageSquare, Wifi, Plus, Pencil, Trash2, X, Smartphone } from 'lucide-react';
import api from '@/lib/api';
import { Canal } from '@/types';

const EMPTY_CANAL = { nome: '', phone_number_id: '', waba_id: '', meta_access_token: '', template_boas_vindas: '', chatwoot_inbox_id: '' };

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [showToken, setShowToken] = useState(false);
  const [canalModal, setCanalModal] = useState<{ open: boolean; editing: Canal | null }>({ open: false, editing: null });
  const [canalForm, setCanalForm] = useState(EMPTY_CANAL);
  const [chatwootOpen, setChatwootOpen] = useState(false);
  const [chatwootForm, setChatwootForm] = useState({ chatwoot_url: '', chatwoot_api_token: '' });

  const { data: canais = [] } = useQuery<Canal[]>({
    queryKey: ['canais'],
    queryFn: async () => (await api.get('/canais')).data,
  });

  const { data: chatwootConfig } = useQuery({
    queryKey: ['chatwoot-config'],
    queryFn: async () => { try { return (await api.get('/chatwoot/config')).data; } catch { return null; } },
  });

  useEffect(() => {
    if (chatwootConfig) {
      setChatwootForm({ chatwoot_url: chatwootConfig.chatwoot_url || '', chatwoot_api_token: '' });
    }
  }, [chatwootConfig]);

  useEffect(() => {
    if (canalModal.editing) {
      setCanalForm({
        nome: canalModal.editing.nome,
        phone_number_id: canalModal.editing.phone_number_id,
        waba_id: canalModal.editing.waba_id,
        meta_access_token: '',
        template_boas_vindas: canalModal.editing.template_boas_vindas || '',
        chatwoot_inbox_id: String(canalModal.editing.chatwoot_inbox_id || ''),
      });
    } else {
      setCanalForm(EMPTY_CANAL);
    }
  }, [canalModal.editing]);

  const createCanal = useMutation({
    mutationFn: () => api.post('/canais', {
      ...canalForm,
      chatwoot_inbox_id: canalForm.chatwoot_inbox_id ? Number(canalForm.chatwoot_inbox_id) : undefined,
    }),
    onSuccess: () => {
      toast.success('Canal criado!');
      queryClient.invalidateQueries({ queryKey: ['canais'] });
      setCanalModal({ open: false, editing: null });
    },
    onError: () => toast.error('Erro ao criar canal.'),
  });

  const updateCanal = useMutation({
    mutationFn: () => api.put(`/canais/${canalModal.editing!.id}`, {
      ...canalForm,
      chatwoot_inbox_id: canalForm.chatwoot_inbox_id ? Number(canalForm.chatwoot_inbox_id) : undefined,
      ...(canalForm.meta_access_token ? {} : { meta_access_token: undefined }),
    }),
    onSuccess: () => {
      toast.success('Canal atualizado!');
      queryClient.invalidateQueries({ queryKey: ['canais'] });
      setCanalModal({ open: false, editing: null });
    },
    onError: () => toast.error('Erro ao atualizar canal.'),
  });

  const deleteCanal = useMutation({
    mutationFn: (id: string) => api.delete(`/canais/${id}`),
    onSuccess: () => {
      toast.success('Canal removido.');
      queryClient.invalidateQueries({ queryKey: ['canais'] });
    },
    onError: () => toast.error('Erro ao remover canal.'),
  });

  const saveChatwoot = useMutation({
    mutationFn: () => api.post('/chatwoot/config', chatwootForm),
    onSuccess: () => toast.success('Chatwoot salvo!'),
    onError: () => toast.error('Erro ao salvar Chatwoot.'),
  });

  const handleSubmitCanal = () => {
    if (canalModal.editing) updateCanal.mutate();
    else createCanal.mutate();
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Canais & Configurações</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gerencie seus números de WhatsApp e integrações</p>
      </div>

      {/* Canais WhatsApp */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Canais WhatsApp</h2>
          <button
            onClick={() => setCanalModal({ open: true, editing: null })}
            className="flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors font-medium"
          >
            <Plus size={13} /> Adicionar Canal
          </button>
        </div>

        {canais.length === 0 ? (
          <div className="card p-8 text-center border-dashed">
            <Smartphone size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm font-medium">Nenhum canal configurado</p>
            <p className="text-gray-400 text-xs mt-1">Adicione seu número de WhatsApp Business para começar</p>
            <button
              onClick={() => setCanalModal({ open: true, editing: null })}
              className="mt-3 btn-primary text-sm"
            >
              Adicionar primeiro canal
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {canais.map((canal) => (
              <div key={canal.id} className={`card p-4 border-l-4 ${canal.ativo ? 'border-l-green-400' : 'border-l-gray-300'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${canal.ativo ? 'bg-green-50' : 'bg-gray-100'}`}>
                      <Smartphone size={18} className={canal.ativo ? 'text-green-600' : 'text-gray-400'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm">{canal.nome}</p>
                        {canal.ativo
                          ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 size={12} /> Ativo</span>
                          : <span className="flex items-center gap-1 text-xs text-gray-400"><XCircle size={12} /> Inativo</span>}
                      </div>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {canal.phone_number_id}</p>
                      <p className="text-xs text-gray-400 font-mono">WABA: {canal.waba_id}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {canal.template_boas_vindas && (
                          <span className="text-xs text-blue-500">Template: {canal.template_boas_vindas}</span>
                        )}
                        {canal.chatwoot_inbox_id && (
                          <span className="text-xs text-purple-500">Inbox: {canal.chatwoot_inbox_id}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCanalModal({ open: true, editing: canal })}
                      className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm('Remover este canal?')) deleteCanal.mutate(canal.id); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

      {/* Modal de Canal */}
      {canalModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-lg">
                {canalModal.editing ? 'Editar Canal' : 'Novo Canal WhatsApp'}
              </h2>
              <button onClick={() => setCanalModal({ open: false, editing: null })}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome do Canal</label>
                <input
                  value={canalForm.nome}
                  onChange={(e) => setCanalForm((p) => ({ ...p, nome: e.target.value }))}
                  className="input"
                  placeholder="Vendas, Suporte, Filial BH..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number ID</label>
                <input
                  value={canalForm.phone_number_id}
                  onChange={(e) => setCanalForm((p) => ({ ...p, phone_number_id: e.target.value }))}
                  className="input font-mono"
                  placeholder="110833535375707443"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">WABA ID</label>
                <input
                  value={canalForm.waba_id}
                  onChange={(e) => setCanalForm((p) => ({ ...p, waba_id: e.target.value }))}
                  className="input font-mono"
                  placeholder="2430248527473659"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Access Token {canalModal.editing && <span className="text-gray-400">(deixe vazio para manter)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={canalForm.meta_access_token}
                    onChange={(e) => setCanalForm((p) => ({ ...p, meta_access_token: e.target.value }))}
                    className="input pr-10 font-mono"
                    placeholder="EAAxxxxxxxx..."
                  />
                  <button onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Template Boas-Vindas</label>
                  <input
                    value={canalForm.template_boas_vindas}
                    onChange={(e) => setCanalForm((p) => ({ ...p, template_boas_vindas: e.target.value }))}
                    className="input"
                    placeholder="boas_vindas"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Chatwoot Inbox ID</label>
                  <input
                    type="number"
                    value={canalForm.chatwoot_inbox_id}
                    onChange={(e) => setCanalForm((p) => ({ ...p, chatwoot_inbox_id: e.target.value }))}
                    className="input"
                    placeholder="1"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setCanalModal({ open: false, editing: null })} className="btn-outline flex-1">Cancelar</button>
                <button
                  onClick={handleSubmitCanal}
                  disabled={createCanal.isPending || updateCanal.isPending}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Save size={14} />
                  {createCanal.isPending || updateCanal.isPending ? 'Salvando...' : canalModal.editing ? 'Atualizar' : 'Criar Canal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
