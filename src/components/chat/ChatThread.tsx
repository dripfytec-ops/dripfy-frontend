'use client';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Send, CheckCheck, Check, Eye, AlertCircle, MessageSquare, SendHorizonal, Clock, Trash2, PhoneIncoming, FileText, Download } from 'lucide-react';
import api, { getMediaUrl } from '@/lib/api';
import { Lead, Message, MessageStatus, PaginatedResponse } from '@/types';
import { getInitials, getAvatarColor } from '@/lib/avatar';

interface Props {
  lead: Lead;
}

const STATUS_CONFIG: Record<MessageStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  enviado:  { label: 'Enviado',  icon: <Check size={13} />,       color: 'text-slate-500', bg: 'bg-slate-100' },
  entregue: { label: 'Entregue', icon: <CheckCheck size={13} />,  color: 'text-blue-500',  bg: 'bg-blue-50' },
  lido:     { label: 'Lido',     icon: <Eye size={13} />,         color: 'text-green-500', bg: 'bg-green-50' },
  erro:     { label: 'Erro',     icon: <AlertCircle size={13} />, color: 'text-red-500',   bg: 'bg-red-50' },
};

function MediaContent({ message }: { message: Message }) {
  if (!message.media_url) return null;
  const url = getMediaUrl(message.media_url);
  const mime = message.media_mime_type || '';

  if (mime.startsWith('image/')) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mb-1.5">
        <img src={url} alt="Imagem recebida" className="rounded-lg max-w-[260px] max-h-[320px] object-cover" />
      </a>
    );
  }
  if (mime.startsWith('audio/')) {
    return <audio controls src={url} className="mb-1.5 max-w-[260px]" />;
  }
  if (mime.startsWith('video/')) {
    return <video controls src={url} className="rounded-lg mb-1.5 max-w-[260px] max-h-[320px]" />;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 mb-1.5 px-3 py-2 rounded-lg bg-black/5 hover:bg-black/10 transition-colors text-sm"
    >
      <FileText size={16} className="flex-shrink-0" />
      <span className="truncate">Documento</span>
      <Download size={14} className="flex-shrink-0 opacity-60" />
    </a>
  );
}

const MEDIA_AUTO_LABELS = ['📷 Imagem', '🎤 Áudio', '🎥 Vídeo', '📄 Documento', '🌟 Figurinha'];

function MessageBubble({ message }: { message: Message }) {
  const isIncoming = message.direction === 'entrada';
  const cfg = STATUS_CONFIG[message.status];
  const date = new Date(message.criado_em);
  const timeStr = `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  const showTextContent = message.content && !(message.media_url && MEDIA_AUTO_LABELS.includes(message.content));

  if (isIncoming) {
    return (
      <div className="flex justify-start mb-3">
        <div className="max-w-[75%]">
          <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
            <MediaContent message={message} />
            {(showTextContent || !message.media_url) && (
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{message.content || '(sem conteúdo)'}</p>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 px-1">{timeStr}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end mb-3">
      <div className="max-w-[75%]">
        <div className="rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm" style={{ background: '#d9fdd3' }}>
          {message.template_name && !message.content && (
            <div className="flex items-center gap-1.5 mb-1">
              <Send size={11} className="opacity-60 text-slate-700" />
              <span className="text-xs opacity-60 font-mono text-slate-700">{message.template_name}</span>
            </div>
          )}
          <MediaContent message={message} />
          {(showTextContent || !message.media_url) && (
            <p className="text-sm whitespace-pre-wrap text-slate-900">{message.content || 'Template enviado'}</p>
          )}
          {message.erro_msg && <p className="text-xs mt-1 text-red-600">{message.erro_msg}</p>}
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

export default function ChatThread({ lead }: Props) {
  const [texto, setTexto] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ['messages', 'lead', lead.id_number],
    queryFn: async () => (await api.get(`/messages/lead/${lead.id_number}`)).data,
    refetchInterval: 8000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const markReadMutation = useMutation({
    mutationFn: async () => (await api.patch(`/leads/${lead.id_number}/read`)).data,
  });

  useEffect(() => {
    if (!lead.unread_count) return;
    markReadMutation.mutate();
    queryClient.setQueriesData<PaginatedResponse<Lead>>({ queryKey: ['leads', 'conversas'] }, (old) => {
      if (!old) return old;
      return { ...old, data: old.data.map((l) => (l.id_number === lead.id_number ? { ...l, unread_count: 0 } : l)) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id_number]);

  const deleteMutation = useMutation({
    mutationFn: async () => (await api.delete(`/messages/lead/${lead.id_number}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'lead', lead.id_number] });
      toast.success('Histórico apagado.');
    },
    onError: () => toast.error('Erro ao apagar histórico.'),
  });

  const handleDelete = () => {
    if (!confirm('Apagar todo o histórico de mensagens deste lead?')) return;
    deleteMutation.mutate();
  };

  const sendMutation = useMutation({
    mutationFn: async (msg: string) => (await api.post(`/messages/reply/${lead.id_number}`, { texto: msg })).data,
    onSuccess: () => {
      setTexto('');
      queryClient.invalidateQueries({ queryKey: ['messages', 'lead', lead.id_number] });
      queryClient.invalidateQueries({ queryKey: ['leads', 'conversas'] });
      textareaRef.current?.focus();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Erro ao enviar mensagem.';
      toast.error(msg);
    },
  });

  const handleSend = () => {
    const trimmed = texto.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const etiquetaNome = lead.etiqueta?.nome ?? lead.status_atual ?? 'Sem etiqueta';
  const etiquetaCor = lead.etiqueta?.cor_hexadecimal ?? '#6B7280';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white text-gray-900 px-4 py-3.5 flex items-center gap-3 flex-shrink-0 border-b border-gray-100">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 text-white"
          style={{ background: getAvatarColor(lead.nome) }}
        >
          {getInitials(lead.nome)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate text-sm">{lead.nome}</p>
          <p className="text-xs text-gray-400 font-mono">{lead.telefone}</p>
        </div>
        <div className="flex items-center gap-2">
          {lead.iniciado_pelo_cliente && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-600">
              <PhoneIncoming size={11} /> Cliente iniciou
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: etiquetaCor + '20', color: etiquetaCor }}>
            {etiquetaNome}
          </span>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            title="Apagar histórico"
            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" style={{ background: '#efeae2' }}>
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && !messages?.length && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <MessageSquare size={40} className="opacity-30" />
            <p className="text-sm">Nenhuma mensagem ainda</p>
            <p className="text-xs text-center text-slate-400">Envie uma campanha ou aguarde o lead entrar em contato</p>
          </div>
        )}
        {messages?.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply box */}
      <div className="border-t border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-end gap-2 p-3">
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem... (Enter para enviar)"
            rows={1}
            className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-colors max-h-32 overflow-y-auto"
            style={{ minHeight: '42px' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 128) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!texto.trim() || sendMutation.isPending}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-white rounded-full disabled:opacity-40 transition-opacity"
            style={{ background: '#00a884' }}
          >
            {sendMutation.isPending
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <SendHorizonal size={16} />}
          </button>
        </div>
        <div className="flex items-center gap-1.5 px-3 pb-2.5">
          <Clock size={10} className="text-slate-300" />
          <p className="text-[10px] text-slate-300">Texto livre apenas dentro de 24h após o cliente responder • Shift+Enter para quebrar linha</p>
        </div>
      </div>
    </div>
  );
}
