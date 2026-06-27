'use client';
import { useQuery } from '@tanstack/react-query';
import { X, Send, CheckCheck, Check, Eye, AlertCircle, MessageSquare } from 'lucide-react';
import api from '@/lib/api';
import { Lead, Message, MessageStatus } from '@/types';

interface Props {
  lead: Lead;
  onClose: () => void;
}

const STATUS_CONFIG: Record<MessageStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  enviado:  { label: 'Enviado',  icon: <Check size={13} />,       color: 'text-slate-500', bg: 'bg-slate-100' },
  entregue: { label: 'Entregue', icon: <CheckCheck size={13} />,  color: 'text-blue-500',  bg: 'bg-blue-50' },
  lido:     { label: 'Lido',     icon: <Eye size={13} />,         color: 'text-green-500', bg: 'bg-green-50' },
  erro:     { label: 'Erro',     icon: <AlertCircle size={13} />, color: 'text-red-500',   bg: 'bg-red-50' },
};

function MessageBubble({ message }: { message: Message }) {
  const isIncoming = message.direction === 'entrada';
  const cfg = STATUS_CONFIG[message.status];
  const date = new Date(message.criado_em);
  const timeStr = `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  if (isIncoming) {
    return (
      <div className="flex justify-start mb-3">
        <div className="max-w-xs">
          <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
            <p className="text-sm text-slate-800">{message.content || '(sem conteúdo)'}</p>
          </div>
          <p className="text-xs text-slate-400 mt-1 px-1">{timeStr}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end mb-3">
      <div className="max-w-xs">
        <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
          {message.template_name && (
            <div className="flex items-center gap-1.5 mb-1">
              <Send size={11} className="opacity-70" />
              <span className="text-xs opacity-70 font-mono">{message.template_name}</span>
            </div>
          )}
          <p className="text-sm">{message.content || 'Template enviado'}</p>
          {message.erro_msg && <p className="text-xs mt-1 text-red-200">{message.erro_msg}</p>}
        </div>
        <div className="flex items-center justify-end gap-1.5 mt-1 px-1">
          <span className="text-xs text-slate-400">{timeStr}</span>
          <span className={`flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
            {cfg.icon} {cfg.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LeadConversation({ lead, onClose }: Props) {
  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ['messages', 'lead', lead.id_number],
    queryFn: async () => (await api.get(`/messages/lead/${lead.id_number}`)).data,
    refetchInterval: 10000,
  });

  const etiquetaNome = lead.etiqueta?.nome ?? lead.status_atual ?? 'Sem etiqueta';
  const etiquetaCor = lead.etiqueta?.cor_hexadecimal ?? '#6B7280';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
            {lead.nome.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{lead.nome}</p>
            <p className="text-xs text-slate-400 font-mono">{lead.telefone}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: etiquetaCor + '30', color: etiquetaCor }}>
              {etiquetaNome}
            </span>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!isLoading && !messages?.length && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <MessageSquare size={40} className="opacity-30" />
              <p className="text-sm">Nenhuma mensagem ainda</p>
            </div>
          )}
          {messages?.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-4 py-3 bg-white">
          {lead.vendedor && (
            <p className="text-xs text-slate-500 mb-1">Vendedor: <strong>{lead.vendedor.nome}</strong></p>
          )}
          <p className="text-xs text-slate-300">Atualiza automaticamente a cada 10s</p>
        </div>
      </div>
    </div>
  );
}
