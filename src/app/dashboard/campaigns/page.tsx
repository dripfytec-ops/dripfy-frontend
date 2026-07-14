'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Play, Pause, X, Send, Smartphone, Upload, FileSpreadsheet, Settings2 } from 'lucide-react';
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

const STATUS_LABEL: Record<CampaignStatus, string> = {
  pausado: 'Pausada',
  rodando: 'Em andamento',
  concluido: 'Concluída',
};

const STATUS_STYLE: Record<CampaignStatus, string> = {
  pausado: 'bg-gray-100 text-gray-600',
  rodando: 'bg-amber-50 text-amber-600',
  concluido: 'bg-green-50 text-green-600',
};

function NovaCampanhaModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [quando, setQuando] = useState<'imediato' | 'agendado'>('imediato');
  const inputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
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

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async ({ usa_nome, image_url, ...rest }: FormData) => {
    setSubmitting(true);
    try {
      const createRes = await api.post('/campaigns', {
        ...rest,
        template_params: { usa_nome },
        ...(image_url ? { image_url } : {}),
      });
      const campanhaId = createRes.data.id;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await api.post(`/leads/upload?campanha_id=${campanhaId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(`Campanha criada! ${uploadRes.data.inserted} leads importados.`);
      } else {
        toast.success('Campanha criada! Importe os leads na tela de Leads antes de iniciar.');
      }

      if (quando === 'imediato' && file) {
        try {
          await api.post(`/campaigns/${campanhaId}/start`);
          toast.success('Disparo iniciado!');
        } catch (e: any) {
          toast.error(e.response?.data?.message || 'Campanha criada, mas não foi possível iniciar automaticamente.');
        }
      }

      onCreated();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao criar campanha.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 text-lg">Nova Campanha</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome da Campanha</label>
            <input {...register('nome_campanha')} className="input" placeholder="Ex: Campanha Julho 2026" />
            {errors.nome_campanha && <p className="text-red-500 text-xs mt-0.5">{errors.nome_campanha.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Canal</label>
            {canais.length === 0 ? (
              <p className="text-amber-600 text-xs p-2 bg-amber-50 rounded-lg">
                Nenhum canal configurado. Acesse <Link href="/dashboard/settings" className="underline font-medium">Canais</Link> para adicionar um número.
              </p>
            ) : (
              <select {...register('canal_id')} className="input">
                <option value="">Selecione um canal...</option>
                {canais.filter((c) => c.ativo).map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            )}
            {errors.canal_id && <p className="text-red-500 text-xs mt-0.5">{errors.canal_id.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Template</label>
            {selectedCanalId && templates.length > 0 ? (
              <select {...register('template_name')} className="input">
                <option value="">Selecione um template...</option>
                {templates.map((t) => (
                  <option key={t.name} value={t.name}>{t.name} ({t.language})</option>
                ))}
              </select>
            ) : (
              <div>
                <input {...register('template_name')} className="input font-mono" placeholder="nome_do_template" />
                {selectedCanalId && <p className="text-amber-600 text-xs mt-1">Nenhum template aprovado encontrado. Digite manualmente.</p>}
                {!selectedCanalId && <p className="text-gray-400 text-xs mt-1">Selecione um canal primeiro.</p>}
              </div>
            )}
            {errors.template_name && <p className="text-red-500 text-xs mt-0.5">{errors.template_name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lista de Contatos (CSV/Excel)</label>
            <p className="text-gray-400 text-xs mb-1.5">Colunas: <strong>nome, telefone</strong> (obrigatórias) · cpf (opcional)</p>
            <div
              onClick={() => inputRef.current?.click()}
              className={`flex items-center gap-2.5 border rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${file ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file ? <FileSpreadsheet size={16} className="text-primary flex-shrink-0" /> : <Upload size={16} className="text-gray-400 flex-shrink-0" />}
              <span className={`text-sm truncate ${file ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {file ? file.name : 'Escolher arquivo'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
            <input type="checkbox" id="usa_nome" {...register('usa_nome')} className="w-4 h-4 accent-primary" />
            <label htmlFor="usa_nome" className="text-sm text-gray-700 cursor-pointer">
              Template usa nome do lead <span className="font-mono text-xs text-gray-500">{'{{1}}'}</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cadência (segundos entre disparos)</label>
            <input {...register('delay_segundos', { valueAsNumber: true })} type="number" min="10" className="input" />
            <p className="text-gray-400 text-xs mt-0.5">Mínimo 10s. Recomendado: 60–120s.</p>
            {errors.delay_segundos && <p className="text-red-500 text-xs mt-0.5">{errors.delay_segundos.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Quando disparar?</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setQuando('imediato')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${quando === 'imediato' ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                Imediato
              </button>
              <button
                type="button"
                disabled
                title="Em breve"
                className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-300 cursor-not-allowed"
              >
                Agendar
              </button>
            </div>
            {quando === 'imediato' && !file && (
              <p className="text-gray-400 text-xs mt-1">Sem arquivo selecionado, a campanha fica pronta para iniciar manualmente depois de importar os leads.</p>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full mt-1">
            {submitting ? 'Criando...' : 'Criar Campanha'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: async () => (await api.get('/campaigns')).data,
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
          <p className="text-gray-500 text-sm mt-0.5">Disparo em massa via API Oficial do WhatsApp — {campaigns.length} campanha{campaigns.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/settings" className="btn-outline flex items-center gap-2">
            <Settings2 size={16} /> Canais
          </Link>
          <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nova Campanha
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          Nenhuma campanha criada. Crie uma campanha e importe leads para começar.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Campanha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Canal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cadência</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Enviados / Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Falhas</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{camp.nome_campanha}</p>
                    <p className="text-xs text-gray-400 font-mono">{camp.template_name}</p>
                  </td>
                  <td className="px-4 py-3">
                    {camp.canal ? (
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <Smartphone size={12} className="text-gray-400" /> {camp.canal.nome}
                      </span>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{camp.delay_segundos}s</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[camp.status]}`}>
                      {STATUS_LABEL[camp.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-700 font-medium whitespace-nowrap">
                        <Send size={11} className="inline mr-1 text-gray-400" />{camp.enviados}/{camp.total_leads}
                      </span>
                      {camp.total_leads > 0 && (
                        <div className="bg-gray-100 rounded-full h-1.5 w-20">
                          <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${(camp.enviados / camp.total_leads) * 100}%` }} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {camp.erros > 0 ? <span className="text-xs text-red-500 font-medium">{camp.erros}</span> : <span className="text-xs text-gray-300">0</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {camp.status === 'rodando' ? (
                      <button onClick={() => pauseCampaign.mutate(camp.id)} className="btn-outline flex items-center gap-1.5 text-xs px-3 py-1.5 ml-auto">
                        <Pause size={12} /> Pausar
                      </button>
                    ) : camp.status === 'pausado' ? (
                      <button onClick={() => startCampaign.mutate(camp.id)} className="btn-primary-sm flex items-center gap-1.5 ml-auto">
                        <Play size={12} /> Iniciar
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <NovaCampanhaModal
          onClose={() => setModalOpen(false)}
          onCreated={() => { queryClient.invalidateQueries({ queryKey: ['campaigns'] }); setModalOpen(false); }}
        />
      )}
    </div>
  );
}
