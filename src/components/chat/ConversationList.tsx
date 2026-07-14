'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Settings2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Lead, Etiqueta, PaginatedResponse } from '@/types';
import { getInitials, getAvatarColor } from '@/lib/avatar';

interface Props {
  selectedLeadId: number | null;
  onSelect: (lead: Lead) => void;
  etiquetas: Etiqueta[];
}

function formatListTime(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function ConversationList({ selectedLeadId, onSelect, etiquetas }: Props) {
  const [search, setSearch] = useState('');
  const [filterEtiqueta, setFilterEtiqueta] = useState('');

  const { data, isLoading } = useQuery<PaginatedResponse<Lead>>({
    queryKey: ['leads', 'conversas', { search, filterEtiqueta }],
    queryFn: async () => {
      const params: any = { sort: 'recent', limit: 50 };
      if (search) params.search = search;
      if (filterEtiqueta) params.etiqueta_id = filterEtiqueta;
      return (await api.get('/leads', { params })).data;
    },
    refetchInterval: 10000,
  });

  const leads = data?.data ?? [];

  return (
    <div className="w-[340px] shrink-0 flex flex-col border-r border-gray-200 bg-white">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100" style={{ background: '#f0f2f5' }}>
        <h2 className="text-base font-semibold text-gray-900">Conversas</h2>
        <Link
          href="/dashboard/settings"
          title="Gerenciar etiquetas"
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-black/5 transition-colors"
        >
          <Settings2 size={16} />
        </Link>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar contato..."
            className="w-full rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none"
            style={{ background: '#f0f2f5' }}
          />
        </div>
      </div>

      {/* Filter */}
      {etiquetas.length > 0 && (
        <div className="px-3 py-2 border-b border-gray-100">
          <select
            value={filterEtiqueta}
            onChange={(e) => setFilterEtiqueta(e.target.value)}
            className="input text-xs py-1.5"
          >
            <option value="">Todos os status</option>
            {etiquetas.map((e) => (
              <option key={e.id} value={e.id}>{e.nome}</option>
            ))}
          </select>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
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
            <button
              key={lead.id_number}
              onClick={() => onSelect(lead)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 transition-colors ${isActive ? 'bg-[#f0f2f5]' : 'hover:bg-gray-50'}`}
            >
              <span
                className="relative rounded-full flex items-center justify-center text-white font-semibold shrink-0 w-11 h-11 text-sm"
                style={{ background: getAvatarColor(lead.nome) }}
              >
                {getInitials(lead.nome)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">{lead.nome}</span>
                  <span className="text-[11px] text-gray-400 shrink-0">{formatListTime(lead.last_message_at ?? lead.criado_em)}</span>
                </span>
                <span className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-xs text-gray-500 truncate">{lead.last_message_preview || 'Nenhuma mensagem ainda'}</span>
                  {unread && (
                    <span
                      className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-semibold shrink-0"
                      style={{ background: '#25D366' }}
                    >
                      {lead.unread_count > 9 ? '9+' : lead.unread_count}
                    </span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
