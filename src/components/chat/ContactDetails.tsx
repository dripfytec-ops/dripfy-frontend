'use client';
import { PhoneIncoming, IdCard, Phone, CalendarDays, Tag, UserCircle2 } from 'lucide-react';
import { Lead } from '@/types';
import { getInitials, getAvatarColor } from '@/lib/avatar';

interface Props {
  lead: Lead;
}

function formatCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function Field({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}

export default function ContactDetails({ lead }: Props) {
  return (
    <div className="w-[280px] shrink-0 flex flex-col border-l border-gray-200 bg-white overflow-y-auto">
      <div className="px-4 py-3.5 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900">Contato</h2>
      </div>

      <div className="flex flex-col items-center text-center px-4 py-6 border-b border-gray-100">
        <span
          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-xl"
          style={{ background: getAvatarColor(lead.nome) }}
        >
          {getInitials(lead.nome)}
        </span>
        <p className="font-semibold text-gray-900 mt-3">{lead.nome}</p>
        {lead.iniciado_pelo_cliente && (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-600 mt-1.5">
            <PhoneIncoming size={11} /> Cliente iniciou
          </span>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        <Field icon={Phone} label="Telefone" value={lead.telefone} />
        {lead.cpf && <Field icon={IdCard} label="CPF" value={formatCpf(lead.cpf)} />}
        {lead.etiqueta && (
          <Field icon={Tag} label="Etiqueta" value={lead.etiqueta.nome} />
        )}
        {lead.vendedor && (
          <Field icon={UserCircle2} label="Vendedor" value={lead.vendedor.nome} />
        )}
        <Field icon={CalendarDays} label="Cadastrado em" value={formatDate(lead.criado_em)} />
      </div>
    </div>
  );
}
