'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, CheckCircle2, Sparkles, Send, Settings2, X } from 'lucide-react';
import api from '@/lib/api';
import { CampanhaDM, OdysseiaTemplateWhatsapp } from '@/types';

const PRIORIDADE_CLASS: Record<string, string> = {
  baixa: 'bg-gray-100 text-gray-600',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-red-100 text-red-700',
};

const PRIORIDADE_LABEL: Record<string, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };

const ODYSSEIA_STATUS_CLASS: Record<string, string> = {
  aguardando: 'bg-amber-100 text-amber-700',
  enviado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
};

function formatarData(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function ModalConfigurarOdysseia({ demanda, onClose }: { demanda: CampanhaDM; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: templates = [], isLoading: carregandoTemplates } = useQuery<OdysseiaTemplateWhatsapp[]>({
    queryKey: ['odysseia-templates'],
    queryFn: async () => (await api.get('/admin/demandas-dripfy/odysseia/templates')).data,
  });

  const agendadoInicial = demanda.agendado_para ? new Date(demanda.agendado_para) : null;
  const [templateId, setTemplateId] = useState(demanda.odysseia_template_id || '');
  const [receptiveFonte, setReceptiveFonte] = useState(demanda.odysseia_receptive_fonte || '');
  const [data, setData] = useState(agendadoInicial ? agendadoInicial.toISOString().slice(0, 10) : '');
  const [hora, setHora] = useState(agendadoInicial ? agendadoInicial.toISOString().slice(11, 16) : '');

  const salvar = useMutation({
    mutationFn: () => api.patch(`/admin/demandas-dripfy/${demanda.id}/odysseia`, {
      template_id: templateId,
      receptive_fonte: receptiveFonte,
      agendado_para: data && hora ? new Date(`${data}T${hora}:00`).toISOString() : undefined,
    }),
    onSuccess: () => {
      toast.success('Demanda configurada pra execução via Odysseia.');
      queryClient.invalidateQueries({ queryKey: ['admin-demandas-dripfy'] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erro ao configurar.'),
  });

  const podeSalvar = templateId && receptiveFonte && data && hora;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Configurar execução via Odysseia</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Demanda: <b>{demanda.nome}</b> — {demanda.total_contatos} contatos
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Template WhatsApp (Odysseia)</label>
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="input bg-white">
              <option value="">{carregandoTemplates ? 'Carregando...' : 'Selecione um template'}</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {templateId && (
              <p className="text-[11px] text-gray-400 mt-1">
                {templates.find((t) => t.id === templateId)?.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Fonte de resposta (número/link que recebe as respostas)</label>
            <input value={receptiveFonte} onChange={(e) => setReceptiveFonte(e.target.value)} placeholder="11999998888" className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Data</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Horário</label>
              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="input" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn-outline text-sm">Cancelar</button>
          <button
            onClick={() => salvar.mutate()}
            disabled={!podeSalvar || salvar.isPending}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {salvar.isPending ? 'Salvando...' : 'Salvar configuração'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DemandasDripfyPage() {
  const queryClient = useQueryClient();
  const [configurando, setConfigurando] = useState<CampanhaDM | null>(null);

  const { data: demandas = [], isLoading } = useQuery<CampanhaDM[]>({
    queryKey: ['admin-demandas-dripfy'],
    queryFn: async () => (await api.get('/admin/demandas-dripfy')).data,
    refetchInterval: 15_000,
  });

  const aprovar = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/demandas-dripfy/${id}/aprovar`),
    onSuccess: () => {
      toast.success('Pagamento confirmado, demanda liberada!');
      queryClient.invalidateQueries({ queryKey: ['admin-demandas-dripfy'] });
    },
    onError: () => toast.error('Erro ao confirmar pagamento.'),
  });

  const disparar = useMutation({
    mutationFn: (id: string) => api.post(`/admin/demandas-dripfy/${id}/disparar-odysseia`),
    onSuccess: () => {
      toast.success('Demanda disparada via Odysseia!');
      queryClient.invalidateQueries({ queryKey: ['admin-demandas-dripfy'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erro ao disparar via Odysseia.'),
  });

  async function exportarCsv(id: string, nome: string) {
    try {
      const res = await api.get(`/admin/demandas-dripfy/${id}/export-csv`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dripfy_${nome.replace(/\s+/g, '_')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erro ao exportar CSV.');
    }
  }

  return (
    <div className="p-6">
      {configurando && <ModalConfigurarOdysseia demanda={configurando} onClose={() => setConfigurando(null)} />}

      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={20} className="text-amber-500" />
        <h1 className="text-2xl font-bold text-gray-900">Demandas Dripfy</h1>
      </div>
      <p className="text-gray-500 text-sm mb-6">Todas as demandas de Disparo Dripfy criadas pelos clientes da plataforma.</p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Cliente</th>
                <th className="text-left px-5 py-3 font-medium">Demanda</th>
                <th className="text-right px-5 py-3 font-medium">Contatos</th>
                <th className="text-left px-5 py-3 font-medium">Agendada</th>
                <th className="text-left px-5 py-3 font-medium">Prioridade</th>
                <th className="text-left px-5 py-3 font-medium">Financeiro</th>
                <th className="text-left px-5 py-3 font-medium">Execução</th>
                <th className="text-right px-5 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-gray-400 text-sm">Carregando…</td></tr>
              )}
              {!isLoading && demandas.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-gray-400 text-sm">Nenhuma demanda Dripfy criada ainda.</td></tr>
              )}
              {!isLoading && demandas.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-800">{d.tenant?.nome_empresa || '—'}</td>
                  <td className="px-5 py-3 text-gray-700">{d.nome}</td>
                  <td className="px-5 py-3 text-right font-mono text-gray-700">{d.total_contatos}</td>
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatarData(d.agendado_para)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${PRIORIDADE_CLASS[d.prioridade] || 'bg-gray-100 text-gray-600'}`}>
                      {PRIORIDADE_LABEL[d.prioridade] || d.prioridade}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      d.financeiro_status === 'pago' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {d.financeiro_status === 'pago' ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        d.execucao === 'odysseia_whatsapp' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {d.execucao === 'odysseia_whatsapp' ? 'Odysseia' : 'Manual'}
                      </span>
                      {d.odysseia_status && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${ODYSSEIA_STATUS_CLASS[d.odysseia_status] || 'bg-gray-100 text-gray-600'}`}>
                          {d.odysseia_status}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {d.financeiro_status !== 'pago' && (
                        <button
                          onClick={() => aprovar.mutate(d.id)}
                          disabled={aprovar.isPending}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <CheckCircle2 size={12} /> Confirmar Pagamento
                        </button>
                      )}
                      {!d.odysseia_job_id && (
                        <button
                          onClick={() => setConfigurando(d)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 hover:border-purple-300 text-gray-600 hover:text-purple-600 text-xs font-medium rounded-lg transition-colors"
                        >
                          <Settings2 size={12} /> Config. Odysseia
                        </button>
                      )}
                      {d.execucao === 'odysseia_whatsapp' && d.financeiro_status === 'pago' && !d.odysseia_job_id && (
                        <button
                          onClick={() => disparar.mutate(d.id)}
                          disabled={disparar.isPending}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <Send size={12} /> Disparar via Odysseia
                        </button>
                      )}
                      <button
                        onClick={() => exportarCsv(d.id, d.nome)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-600 text-xs font-medium rounded-lg transition-colors"
                      >
                        <Download size={12} /> Exportar CSV
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
