'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Play, Pause, X, Clock, Send, Smartphone } from 'lucide-react';
import api from '@/lib/api';
import { Campaign, CampaignStatus, Canal } from '@/types';

const schema = z.object({
  nome_campanha: z.string().min(2),
  template_name: z.string().min(2),
  canal_id: z.string().min(1, 'Selecione um canal'),
  delay_segundos: z.number().int().min(10),
  usa_nome: z.boolean().default(false),
  image_url: z.string().url('URL inválida').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

const STATUS_STYLE: Record<CampaignStatus, string> = {
  pausado: 'bg-gray-100 text-gray-700',
  rodando: 'bg-green-100 text-green-700',
  concluido: 'bg-blue-100 text-blue-700',
};

export default function CampaignsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: async () => (await api.get('/campaigns')).data,
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { delay_segundos: 60, usa_nome: false },
  });

  const { data: canais = [] } = useQuery<Canal[]>({
    queryKey: ['canais'],
    queryFn: async () => (await api.get('/canais')).data,
  });

  const selectedCanalId = watch('canal_id');

  const { data: templates = [] } = useQuery<{ name: string; language: string }[]>({
    queryKey: ['canal-templates', selectedCanalId],
    queryFn: async () => {
      try { return (await api.get(`/canais/${selectedCanalId}/templates`)).data; } catch { return []; }
    },
    enabled: !!selectedCanalId,
  });

  const create = useMutation({
    mutationFn: ({ usa_nome, image_url, ...rest }: FormData) => api.post('/campaigns', {
      ...rest,
      template_params: { usa_nome },
      ...(image_url ? { image_url } : {}),
    }),
    onSuccess: () => { toast.success('Campanha criada!'); queryClient.invalidateQueries({ queryKey: ['campaigns'] }); setModalOpen(false); reset(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro ao criar campanha.'),
  });

  const startCampaign = useMutation({
    mutationFn: (id: string) => api.post(`/campaigns/${id}/start`),
    onSuccess: (res) => { toast.success(res.data.message); queryClient.invalidateQueries({ queryKey: ['campaigns'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro ao iniciar campanha.'),
  });

  const pauseCampaign = useMutation({
    mutationFn: (id: string) => api.post(`/campaigns/${id}/pause`),
    onSuccess: () => { toast.success('Campanha pausada.'); queryClient.invalidateQueries({ queryKey: ['campaigns'] }); },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campanhas</h1>
          <p className="text-gray-500 text-sm">Gerencie seus disparos conta-gotas</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nova Campanha
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((camp) => (
            <div key={camp.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{camp.nome_campanha}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[camp.status]}`}>
                      {camp.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-gray-500 text-sm font-mono">Template: {camp.template_name}</p>
                    {(camp as any).canal && (
                      <span className="flex items-center gap-1 text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                        <Smartphone size={11} /> {(camp as any).canal.nome}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock size={13} /> {camp.delay_segundos}s de intervalo
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Send size={13} /> {camp.enviados}/{camp.total_leads} enviados
                    </div>
                    {camp.erros > 0 && (
                      <span className="text-xs text-red-500">{camp.erros} erros</span>
                    )}
                  </div>
                  {camp.total_leads > 0 && (
                    <div className="mt-2 bg-gray-100 rounded-full h-1.5 w-64">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${(camp.enviados / camp.total_leads) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {camp.status === 'rodando' ? (
                    <button onClick={() => pauseCampaign.mutate(camp.id)} className="btn-outline flex items-center gap-1.5 text-sm">
                      <Pause size={14} /> Pausar
                    </button>
                  ) : camp.status === 'pausado' ? (
                    <button onClick={() => startCampaign.mutate(camp.id)} className="btn-primary flex items-center gap-1.5 text-sm">
                      <Play size={14} /> Iniciar
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          {campaigns.length === 0 && (
            <div className="card p-12 text-center text-gray-400">
              Nenhuma campanha criada. Crie uma campanha e importe leads para começar.
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-lg">Nova Campanha</h2>
              <button onClick={() => { setModalOpen(false); reset(); }}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit((d) => create.mutate(d))} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome da Campanha</label>
                <input {...register('nome_campanha')} className="input" placeholder="Campanha Natal 2025" />
                {errors.nome_campanha && <p className="text-red-500 text-xs mt-0.5">{errors.nome_campanha.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Canal WhatsApp</label>
                {canais.length === 0 ? (
                  <p className="text-amber-500 text-xs p-2 bg-amber-50 rounded-lg">Nenhum canal configurado. Acesse <strong>Canais</strong> para adicionar um número.</p>
                ) : (
                  <select {...register('canal_id')} className="input">
                    <option value="">Selecione um canal...</option>
                    {canais.filter((c) => c.ativo).map((c) => (
                      <option key={c.id} value={c.id}>{c.nome} — {c.phone_number_id}</option>
                    ))}
                  </select>
                )}
                {errors.canal_id && <p className="text-red-500 text-xs mt-0.5">{errors.canal_id.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Template WhatsApp</label>
                {selectedCanalId && templates.length > 0 ? (
                  <select {...register('template_name')} className="input">
                    <option value="">Selecione um template aprovado...</option>
                    {templates.map((t) => (
                      <option key={t.name} value={t.name}>{t.name} ({t.language})</option>
                    ))}
                  </select>
                ) : (
                  <div>
                    <input {...register('template_name')} className="input font-mono" placeholder="nome_do_template" />
                    {selectedCanalId && <p className="text-amber-500 text-xs mt-1">Nenhum template aprovado. Digite o nome manualmente.</p>}
                    {!selectedCanalId && <p className="text-gray-400 text-xs mt-1">Selecione um canal primeiro.</p>}
                  </div>
                )}
                {errors.template_name && <p className="text-red-500 text-xs mt-0.5">{errors.template_name.message}</p>}
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <input type="checkbox" id="usa_nome" {...register('usa_nome')} className="w-4 h-4 accent-primary" />
                <label htmlFor="usa_nome" className="text-sm text-gray-700 cursor-pointer">
                  Template usa nome do lead <span className="font-mono text-xs text-gray-500">{'{{1}}'}</span>
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  URL da imagem <span className="text-gray-400 font-normal">(opcional — apenas para templates com imagem no header)</span>
                </label>
                <input {...register('image_url')} className="input" placeholder="https://seusite.com/imagem.jpg" />
                {errors.image_url && <p className="text-red-500 text-xs mt-0.5">{errors.image_url.message}</p>}
                <p className="text-gray-400 text-xs mt-0.5">Use uma URL permanente e pública. Deixe vazio para templates sem imagem.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Intervalo entre disparos (segundos)</label>
                <input {...register('delay_segundos', { valueAsNumber: true })} type="number" min="10" className="input" />
                <p className="text-gray-400 text-xs mt-0.5">Mínimo 10 segundos. Recomendado: 60–120s.</p>
                {errors.delay_segundos && <p className="text-red-500 text-xs mt-0.5">{errors.delay_segundos.message}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setModalOpen(false); reset(); }} className="btn-outline flex-1">Cancelar</button>
                <button type="submit" disabled={create.isPending} className="btn-primary flex-1">
                  {create.isPending ? 'Criando...' : 'Criar Campanha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
