'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, CheckCircle2, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { CampanhaDM } from '@/types';

const PRIORIDADE_CLASS: Record<string, string> = {
  baixa: 'bg-gray-100 text-gray-600',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-red-100 text-red-700',
};

const PRIORIDADE_LABEL: Record<string, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };

function formatarData(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function DemandasDripfyPage() {
  const queryClient = useQueryClient();

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
                <th className="text-right px-5 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400 text-sm">Carregando…</td></tr>
              )}
              {!isLoading && demandas.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400 text-sm">Nenhuma demanda Dripfy criada ainda.</td></tr>
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
