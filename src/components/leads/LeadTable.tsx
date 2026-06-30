'use client';
import { useState, useRef, useEffect } from 'react';
import { Lead, PaginatedResponse, Etiqueta, Vendedor } from '@/types';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, MessageSquare, ChevronDown, UserCircle2, PhoneIncoming } from 'lucide-react';

interface Props {
  data?: PaginatedResponse<Lead>;
  loading: boolean;
  page: number;
  onPageChange: (p: number) => void;
  etiquetas: Etiqueta[];
  onChangeEtiqueta: (leadId: number, etiquetaId: string) => void;
  onAssignVendedor: (leadId: number, vendedorId: string | null) => void;
  onSelectLead: (lead: Lead) => void;
  vendedores: Vendedor[];
  isAdmin: boolean;
}

function EtiquetaBadge({ lead, etiquetas, onChange }: { lead: Lead; etiquetas: Etiqueta[]; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = etiquetas.find((e) => e.id === lead.etiqueta_id);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors hover:opacity-80"
        style={{ backgroundColor: (current?.cor_hexadecimal || '#6B7280') + '20', color: current?.cor_hexadecimal || '#6B7280', borderColor: (current?.cor_hexadecimal || '#6B7280') + '50' }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: current?.cor_hexadecimal || '#6B7280' }} />
        {current?.nome || 'Sem etiqueta'}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-max py-1">
          {etiquetas.map((et) => (
            <button
              key={et.id}
              onClick={() => { onChange(et.id); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors"
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: et.cor_hexadecimal }} />
              {et.nome}
              {et.id === lead.etiqueta_id && <CheckCircle2 size={11} className="text-green-500 ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function VendedorCell({ lead, vendedores, isAdmin, onChange }: { lead: Lead; vendedores: Vendedor[]; isAdmin: boolean; onChange: (id: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isAdmin) {
    return <span className="text-xs text-gray-500 flex items-center gap-1"><UserCircle2 size={12} />{lead.vendedor?.nome ?? '—'}</span>;
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors">
        <UserCircle2 size={12} />
        {lead.vendedor?.nome ?? 'Atribuir'}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-max py-1">
          <button onClick={() => { onChange(null); setOpen(false); }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-400">
            Sem vendedor
          </button>
          {vendedores.map((v) => (
            <button key={v.id} onClick={() => { onChange(v.id); setOpen(false); }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-50">
              <UserCircle2 size={12} className="text-gray-400" />
              {v.nome}
              {v.id === lead.vendedor_id && <CheckCircle2 size={11} className="text-green-500 ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LeadTable({ data, loading, page, onPageChange, etiquetas, onChangeEtiqueta, onAssignVendedor, onSelectLead, vendedores, isAdmin }: Props) {
  if (loading) {
    return <div className="card p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
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
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Etiqueta</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vendedor</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Disparado</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cadastro</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Conversa</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data?.data?.map((lead) => (
            <tr key={lead.id_number} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-400 font-mono text-xs">{lead.id_number}</td>
              <td className="px-4 py-3 font-medium text-gray-900">
                <span className="flex items-center gap-1.5">
                  {lead.nome}
                  {lead.iniciado_pelo_cliente && (
                    <span title="Cliente iniciou a conversa" className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-500 whitespace-nowrap">
                      <PhoneIncoming size={9} /> Iniciou
                    </span>
                  )}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600 font-mono">{lead.telefone}</td>
              <td className="px-4 py-3 text-gray-500">{lead.cpf || '—'}</td>
              <td className="px-4 py-3">
                <EtiquetaBadge lead={lead} etiquetas={etiquetas} onChange={(id) => onChangeEtiqueta(lead.id_number, id)} />
              </td>
              <td className="px-4 py-3">
                <VendedorCell lead={lead} vendedores={vendedores} isAdmin={isAdmin} onChange={(id) => onAssignVendedor(lead.id_number, id)} />
              </td>
              <td className="px-4 py-3">
                {lead.disparado ? <CheckCircle2 size={16} className="text-green-500" /> : <Circle size={16} className="text-gray-300" />}
              </td>
              <td className="px-4 py-3 text-gray-400 text-xs">{new Date(lead.criado_em).toLocaleDateString('pt-BR')}</td>
              <td className="px-4 py-3">
                <button onClick={() => onSelectLead(lead)} className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                  <MessageSquare size={13} /> Ver
                </button>
              </td>
            </tr>
          ))}
          {!data?.data?.length && (
            <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">Nenhum lead encontrado.</td></tr>
          )}
        </tbody>
      </table>
      {data && data.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">{data.total} leads — Página {page} de {data.totalPages}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"><ChevronLeft size={14} /></button>
            <button onClick={() => onPageChange(page + 1)} disabled={page === data.totalPages} className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
