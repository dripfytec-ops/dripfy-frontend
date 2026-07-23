'use client';
import { useMemo, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Filter, User as UserIcon, X } from 'lucide-react';
import api from '@/lib/api';
import { useCampanhasDM } from '@/lib/dm-api';
import { auth } from '@/lib/auth';
import { Lead, Etiqueta, Vendedor, PaginatedResponse } from '@/types';
import { getInitials, getAvatarColor } from '@/lib/avatar';

const PAGE_SIZE = 50;

interface ContextMenuState {
  x: number;
  y: number;
  leadId: number;
  unread: boolean;
}

interface Props {
  selectedLeadId: number | null;
  onSelect: (lead: Lead) => void;
  etiquetas: Etiqueta[];
  vendedores?: Vendedor[];
  isAdmin?: boolean;
  onNewConversation: () => void;
}

function formatListTime(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function ConversationList({ selectedLeadId, onSelect, etiquetas, vendedores = [], isAdmin = false, onNewConversation }: Props) {
  const [search, setSearch] = useState('');
  const [filterEtiqueta, setFilterEtiqueta] = useState('');
  const [filterCampanha, setFilterCampanha] = useState('');
  const [filterVendedor, setFilterVendedor] = useState('');
  const [quickTab, setQuickTab] = useState<'mine' | 'all'>('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const currentUser = auth.getUser();
  const { data: campanhas = [] } = useCampanhasDM();
  const queryClient = useQueryClient();

  const toggleReadMutation = useMutation({
    mutationFn: async ({ id, lida }: { id: number; lida: boolean }) =>
      (await api.patch(`/leads/${id}/read`, { lida })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads', 'conversas'] }),
  });

  const effectiveVendedorId = quickTab === 'mine' ? currentUser?.id : filterVendedor;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['leads', 'conversas', { search, filterEtiqueta, filterCampanha, effectiveVendedorId }],
    queryFn: async ({ pageParam }) => {
      const params: any = { sort: 'recent', limit: PAGE_SIZE, page: pageParam };
      if (search) params.search = search;
      if (filterEtiqueta) params.etiqueta_id = filterEtiqueta;
      if (filterCampanha) params.origem_campanha_id = filterCampanha;
      if (effectiveVendedorId) params.vendedor_id = effectiveVendedorId;
      return (await api.get('/leads', { params })).data as PaginatedResponse<Lead>;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    refetchInterval: 10000,
  });

  // Conversas ativas (novas mensagens, campanhas) podem mudar de posição no
  // "recent" entre páginas — dedup evita repetir o mesmo lead em duas.
  const leads = useMemo(() => {
    const all = data?.pages.flatMap((p) => p.data) ?? [];
    const seen = new Set<number>();
    return all.filter((l) => (seen.has(l.id_number) ? false : (seen.add(l.id_number), true)));
  }, [data]);

  const total = data?.pages[0]?.total ?? 0;
  const campanhaSelecionada = campanhas.find((c) => c.id === filterCampanha);
  const activeFilterCount = [filterEtiqueta, filterCampanha, filterVendedor].filter(Boolean).length;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 150 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const clearFilters = () => {
    setFilterEtiqueta('');
    setFilterCampanha('');
    setFilterVendedor('');
  };

  return (
    <div className="w-[340px] shrink-0 flex flex-col border-r border-gray-200 bg-white min-h-0">
      {/* Header */}
      <div className="px-4 py-3.5 flex items-center justify-between border-b border-gray-100 bg-white">
        <h2 className="text-base font-bold text-gray-900">Conversas</h2>
        <button
          onClick={onNewConversation}
          title="Nova conversa"
          className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Plus size={17} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-gray-100 bg-white">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar contato ou conversa"
            className="w-full bg-gray-100 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Tabs + filter icon */}
      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setQuickTab('mine')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${quickTab === 'mine' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Minhas
          </button>
          <button
            onClick={() => setQuickTab('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${quickTab === 'all' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Todas
          </button>
        </div>
        {(etiquetas.length > 0 || campanhas.length > 0) && (
          <button
            onClick={() => setShowFilterPanel((v) => !v)}
            title="Filtrar conversas"
            className={`relative p-1.5 rounded-lg transition-colors ${showFilterPanel || activeFilterCount > 0 ? 'text-primary bg-blue-50' : 'text-gray-400 hover:text-primary hover:bg-blue-50'}`}
          >
            <Filter size={16} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary text-white text-[9px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilterPanel && (
        <div className="px-3 py-3 border-b border-gray-100 bg-gray-50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Filtrar conversas</span>
            <button onClick={() => setShowFilterPanel(false)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          {etiquetas.length > 0 && (
            <div>
              <label className="text-[11px] text-gray-500 block mb-1">Etiqueta</label>
              <select value={filterEtiqueta} onChange={(e) => setFilterEtiqueta(e.target.value)} className="input text-xs py-1.5">
                <option value="">Todas as etiquetas</option>
                {etiquetas.map((e) => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </div>
          )}
          {campanhas.length > 0 && (
            <div>
              <label className="text-[11px] text-gray-500 block mb-1">Campanha</label>
              <select value={filterCampanha} onChange={(e) => setFilterCampanha(e.target.value)} className="input text-xs py-1.5">
                <option value="">Todas as campanhas</option>
                {campanhas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          )}
          {isAdmin && vendedores.length > 0 && (
            <div>
              <label className="text-[11px] text-gray-500 block mb-1">Atendente</label>
              <select
                value={filterVendedor}
                onChange={(e) => setFilterVendedor(e.target.value)}
                disabled={quickTab === 'mine'}
                className="input text-xs py-1.5 disabled:opacity-50"
              >
                <option value="">Todos os atendentes</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>{v.nome}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-700">Limpar filtros</button>
            <button onClick={() => setShowFilterPanel(false)} className="btn-primary text-xs px-3 py-1.5">Aplicar filtros</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0" onScroll={handleScroll}>
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && leads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-1 px-4 text-center">
            <p className="text-sm">Nenhuma conversa encontrada</p>
          </div>
        )}
        {leads.map((lead) => {
          const isActive = lead.id_number === selectedLeadId;
          const unread = lead.unread_count > 0;
          return (
            <div
              key={lead.id_number}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(lead)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSelect(lead); }}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, leadId: lead.id_number, unread });
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 transition-colors cursor-pointer ${isActive ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
            >
              <span
                className="relative rounded-full flex items-center justify-center text-white font-semibold shrink-0 w-11 h-11 text-sm"
                style={{ background: getAvatarColor(lead.nome) }}
              >
                {getInitials(lead.nome)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900 truncate">{lead.nome}</span>
                  <span className="flex flex-col items-end shrink-0">
                    <span className="text-[11px] text-gray-400">{formatListTime(lead.last_message_at ?? lead.criado_em)}</span>
                    {lead.vendedor && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                        <UserIcon size={9} />
                        <span className="truncate max-w-[90px]">{lead.vendedor.nome}</span>
                      </span>
                    )}
                  </span>
                </span>
                <span className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-xs text-gray-500 truncate">{lead.last_message_preview || 'Nenhuma mensagem ainda'}</span>
                  {unread && (
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#25D366' }} />
                  )}
                </span>
                {lead.etiquetas.length > 0 && (
                  <span className="flex flex-wrap items-center gap-1 mt-1">
                    {lead.etiquetas.map((et) => (
                      <span
                        key={et.id}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ backgroundColor: et.cor_hexadecimal + '20', color: et.cor_hexadecimal }}
                      >
                        {et.nome}
                      </span>
                    ))}
                  </span>
                )}
              </span>
            </div>
          );
        })}
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && !hasNextPage && leads.length > 0 && (
          <p className="text-center text-[11px] text-gray-300 py-3">{leads.length} de {total} conversas</p>
        )}
      </div>

      {filterCampanha && (
        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-gray-900">{total}</span> contato{total === 1 ? '' : 's'} vindo{total === 1 ? '' : 's'} de{' '}
            <span className="font-medium">{campanhaSelecionada?.nome ?? 'campanha selecionada'}</span>
          </p>
        </div>
      )}

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }} />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[190px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={() => {
                // contextMenu.unread = true → item mostra "Marcar como lida" → lida: true.
                // contextMenu.unread = false → item mostra "Marcar como não lida" → lida: false.
                toggleReadMutation.mutate({ id: contextMenu.leadId, lida: contextMenu.unread });
                setContextMenu(null);
              }}
              className="w-full px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
            >
              {contextMenu.unread ? 'Marcar como lida' : 'Marcar como não lida'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
