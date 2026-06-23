'use client';
import { Lead, LeadStatus, PaginatedResponse } from '@/types';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, MessageSquare } from 'lucide-react';

interface Props {
  data?: PaginatedResponse<Lead>;
  loading: boolean;
  page: number;
  onPageChange: (p: number) => void;
  statusLabels: Record<LeadStatus, string>;
  onSelectLead: (lead: Lead) => void;
}

const STATUS_CLASSES: Record<LeadStatus, string> = {
  balde_geral: 'badge-balde_geral',
  aguardando_resposta: 'badge-aguardando_resposta',
  em_atendimento: 'badge-em_atendimento',
  finalizado: 'badge-finalizado',
};

export default function LeadTable({ data, loading, page, onPageChange, statusLabels, onSelectLead }: Props) {
  if (loading) {
    return (
      <div className="card p-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nome</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Telefone</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">CPF</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Disparado</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cadastro</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Conversa</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data?.data?.map((lead) => (
            <tr key={lead.id_number} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-400 font-mono text-xs">{lead.id_number}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{lead.nome}</td>
              <td className="px-4 py-3 text-gray-600 font-mono">{lead.telefone}</td>
              <td className="px-4 py-3 text-gray-500">{lead.cpf || '—'}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[lead.status_atual]}`}>
                  {statusLabels[lead.status_atual]}
                </span>
              </td>
              <td className="px-4 py-3">
                {lead.disparado
                  ? <CheckCircle2 size={16} className="text-green-500" />
                  : <Circle size={16} className="text-gray-300" />}
              </td>
              <td className="px-4 py-3 text-gray-400 text-xs">
                {new Date(lead.criado_em).toLocaleDateString('pt-BR')}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onSelectLead(lead)}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <MessageSquare size={13} />
                  Ver
                </button>
              </td>
            </tr>
          ))}
          {!data?.data?.length && (
            <tr>
              <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                Nenhum lead encontrado. Importe uma planilha para começar.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {data && data.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {data.total} leads no total — Página {page} de {data.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === data.totalPages}
              className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
