'use client';
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LayoutList, Kanban, Upload, Search, Users, Send, MessageSquare, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { auth } from '@/lib/auth';
import { Lead, Etiqueta, Vendedor, PaginatedResponse, KanbanBoard } from '@/types';
import LeadTable from '@/components/leads/LeadTable';
import LeadKanban from '@/components/leads/LeadKanban';
import UploadModal from '@/components/leads/UploadModal';
import LeadConversation from '@/components/leads/LeadConversation';

type ViewMode = 'list' | 'kanban';

export default function LeadsPage() {
  const [view, setView] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [filterEtiqueta, setFilterEtiqueta] = useState('');
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const queryClient = useQueryClient();
  const user = auth.getUser();

  const isAdmin = user?.role === 'lojista_admin' || user?.role === 'admin_master';

  const { data: stats } = useQuery<{ total: number; disparados: number; emAtendimento: number; mensagens: number }>({
    queryKey: ['leads-stats'],
    queryFn: async () => (await api.get('/leads/stats')).data,
    refetchInterval: 30000,
  });

  const { data: etiquetas = [] } = useQuery<Etiqueta[]>({
    queryKey: ['etiquetas'],
    queryFn: async () => (await api.get('/etiquetas')).data,
  });

  const { data: vendedores = [] } = useQuery<Vendedor[]>({
    queryKey: ['vendedores'],
    queryFn: async () => { try { return (await api.get('/leads/vendedores')).data; } catch { return []; } },
    enabled: isAdmin,
  });

  const { data: listData, isLoading: listLoading } = useQuery<PaginatedResponse<Lead>>({
    queryKey: ['leads', 'list', { search, filterEtiqueta, page }],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (filterEtiqueta) params.etiqueta_id = filterEtiqueta;
      return (await api.get('/leads', { params })).data;
    },
    enabled: view === 'list',
    refetchInterval: 10000,
  });

  const { data: kanbanData, isLoading: kanbanLoading } = useQuery<KanbanBoard>({
    queryKey: ['leads', 'kanban'],
    queryFn: async () => (await api.get('/leads/kanban')).data,
    enabled: view === 'kanban',
    refetchInterval: 10000,
  });

  const updateEtiqueta = useMutation({
    mutationFn: ({ id, etiqueta_id }: { id: number; etiqueta_id: string }) =>
      api.patch(`/leads/${id}/etiqueta`, { etiqueta_id }),
    onMutate: async ({ id: leadId, etiqueta_id: etiquetaId }) => {
      await queryClient.cancelQueries({ queryKey: ['leads', 'kanban'] });
      const previous = queryClient.getQueryData<KanbanBoard>(['leads', 'kanban']);
      if (previous) {
        const newColunas: Record<string, Lead[]> = {};
        let movedLead: Lead | undefined;
        for (const [etId, leads] of Object.entries(previous.colunas)) {
          const idx = leads.findIndex((l) => l.id_number === leadId);
          if (idx !== -1) {
            movedLead = leads[idx];
            newColunas[etId] = leads.filter((l) => l.id_number !== leadId);
          } else {
            newColunas[etId] = leads;
          }
        }
        if (movedLead) {
          newColunas[etiquetaId] = [...(newColunas[etiquetaId] || []), { ...movedLead, etiqueta_id: etiquetaId }];
        }
        queryClient.setQueryData<KanbanBoard>(['leads', 'kanban'], { ...previous, colunas: newColunas });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['leads', 'kanban'], context.previous);
      toast.error('Erro ao mover lead.');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });

  const assignVendedor = useMutation({
    mutationFn: ({ id, vendedor_id }: { id: number; vendedor_id: string | null }) =>
      api.patch(`/leads/${id}/vendedor`, { vendedor_id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
    onError: () => toast.error('Erro ao atribuir vendedor.'),
  });

  const handleDrop = useCallback((leadId: number, etiquetaId: string) => {
    updateEtiqueta.mutate({ id: leadId, etiqueta_id: etiquetaId });
  }, [updateEtiqueta]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gerencie seus contatos e acompanhe o pipeline</p>
        </div>
        <button onClick={() => setUploadOpen(true)} className="btn-primary flex items-center gap-2">
          <Upload size={16} /> Importar Planilha
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total de Leads',      value: stats?.total ?? '—',          icon: Users,          color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Disparados',           value: stats?.disparados ?? '—',     icon: Send,           color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Em Atendimento',       value: stats?.emAtendimento ?? '—',  icon: MessageSquare,  color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Mensagens Enviadas',   value: stats?.mensagens ?? '—',      icon: CheckCircle2,   color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} flex-shrink-0`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex bg-white border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutList size={15} /> Lista
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'kanban' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Kanban size={15} /> Kanban
          </button>
        </div>

        {view === 'list' && (
          <>
            <div className="relative flex-1 max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar por nome, CPF ou telefone..."
                className="input pl-9"
              />
            </div>
            <select
              value={filterEtiqueta}
              onChange={(e) => { setFilterEtiqueta(e.target.value); setPage(1); }}
              className="input w-48"
            >
              <option value="">Todos os status</option>
              {etiquetas.map((e) => (
                <option key={e.id} value={e.id}>{e.nome}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {view === 'list' ? (
        <LeadTable
          data={listData}
          loading={listLoading}
          page={page}
          onPageChange={setPage}
          etiquetas={etiquetas}
          onChangeEtiqueta={(leadId, etiquetaId) => updateEtiqueta.mutate({ id: leadId, etiqueta_id: etiquetaId })}
          onAssignVendedor={(leadId, vendedorId) => assignVendedor.mutate({ id: leadId, vendedor_id: vendedorId })}
          onSelectLead={setSelectedLead}
          vendedores={vendedores}
          isAdmin={isAdmin}
        />
      ) : (
        <LeadKanban
          data={kanbanData}
          loading={kanbanLoading}
          onDrop={handleDrop}
          vendedores={vendedores}
          isAdmin={isAdmin}
          onSelectLead={setSelectedLead}
        />
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['leads'] }); setUploadOpen(false); }}
      />

      {selectedLead && (
        <LeadConversation lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  );
}
