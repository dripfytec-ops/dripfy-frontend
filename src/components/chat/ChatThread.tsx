'use client';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Send, CheckCheck, Check, AlertCircle, MessageSquare, SendHorizonal, Clock, Trash2, PhoneIncoming, FileText, Download, Zap, Mic, Square, X } from 'lucide-react';
import api, { getMediaUrl } from '@/lib/api';
import { Lead, Message, MessageStatus, PaginatedResponse, QuickReply } from '@/types';
import { getInitials, getAvatarColor } from '@/lib/avatar';

interface Props {
  lead: Lead;
}

const STATUS_CONFIG: Record<MessageStatus, { icon: React.ReactNode; color: string }> = {
  enviado:  { icon: <Check size={15} />,     color: 'text-slate-400' },
  entregue: { icon: <CheckCheck size={15} />, color: 'text-slate-400' },
  lido:     { icon: <CheckCheck size={15} />, color: 'text-blue-500' },
  erro:     { icon: <AlertCircle size={15} />, color: 'text-red-500' },
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
        <div className="flex items-center justify-end gap-1 mt-1 px-1">
          <span className="text-xs text-slate-400">{timeStr}</span>
          <span className={cfg.color}>{cfg.icon}</span>
        </div>
      </div>
    </div>
  );
}

export default function ChatThread({ lead }: Props) {
  const [texto, setTexto] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queryClient = useQueryClient();

  const { data: quickReplies = [] } = useQuery<QuickReply[]>({
    queryKey: ['quick-replies'],
    queryFn: async () => (await api.get('/quick-replies')).data,
    staleTime: 60_000,
  });

  const slashQuery = texto.startsWith('/') ? texto.slice(1).toLowerCase() : null;
  const quickRepliesOpen = showQuickReplies || slashQuery !== null;
  const filteredQuickReplies = slashQuery
    ? quickReplies.filter((q) => q.titulo.toLowerCase().includes(slashQuery) || q.texto.toLowerCase().includes(slashQuery))
    : quickReplies;

  const applyQuickReply = (qr: QuickReply) => {
    setTexto(qr.texto);
    setShowQuickReplies(false);
    textareaRef.current?.focus();
  };

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ['messages', 'lead', lead.id_number],
    queryFn: async () => (await api.get(`/messages/lead/${lead.id_number}`)).data,
    refetchInterval: 8000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      setRecordedBlob(null);
      setRecordedUrl(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id_number]);

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

  const sendAudioMutation = useMutation({
    mutationFn: async (blob: Blob) => {
      const formData = new FormData();
      formData.append('file', blob, `audio.${blob.type.includes('mp4') ? 'm4a' : 'webm'}`);
      return (await api.post(`/messages/reply-media/${lead.id_number}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data;
    },
    onSuccess: () => {
      discardRecording();
      queryClient.invalidateQueries({ queryKey: ['messages', 'lead', lead.id_number] });
      queryClient.invalidateQueries({ queryKey: ['leads', 'conversas'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Erro ao enviar áudio.';
      toast.error(msg);
    },
  });

  const stopStream = () => {
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch {
      toast.error('Não foi possível acessar o microfone. Verifique a permissão do navegador.');
    }
  };

  // Para a gravação e mostra um preview (ouvir / apagar / enviar) em vez de
  // mandar direto — evita enviar um áudio errado ou vazio sem querer.
  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      if (blob.size > 0) {
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
      }
    };
    recorder.stop();
    stopStream();
    setIsRecording(false);
  };

  const cancelRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder) {
      recorder.onstop = null;
      recorder.stop();
    }
    stopStream();
    setIsRecording(false);
  };

  const discardRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
  };

  const confirmSendRecording = () => {
    if (recordedBlob) sendAudioMutation.mutate(recordedBlob);
  };

  const formatRecordingTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const etiquetaNome = lead.etiqueta?.nome ?? lead.status_atual ?? 'Sem etiqueta';
  const etiquetaCor = lead.etiqueta?.cor_hexadecimal ?? '#6B7280';

  return (
    <div className="flex flex-col h-full min-h-0">
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
      <div className="flex-1 overflow-y-auto p-4 min-h-0" style={{ background: '#efeae2' }}>
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
      <div className="border-t border-slate-200 bg-white flex-shrink-0 relative">
        {quickRepliesOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto z-10">
            {filteredQuickReplies.length === 0 ? (
              <p className="text-xs text-slate-400 px-3 py-3">
                {quickReplies.length === 0 ? 'Nenhuma resposta rápida cadastrada (Configurações → Respostas Rápidas).' : 'Nenhuma resposta encontrada.'}
              </p>
            ) : (
              filteredQuickReplies.map((qr) => (
                <button
                  key={qr.id}
                  onClick={() => applyQuickReply(qr)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                >
                  <p className="text-xs font-semibold text-slate-700">{qr.titulo}</p>
                  <p className="text-xs text-slate-400 truncate">{qr.texto}</p>
                </button>
              ))
            )}
          </div>
        )}
        {isRecording ? (
          <div className="flex items-center gap-3 p-3">
            <button
              onClick={cancelRecording}
              title="Cancelar gravação"
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <span className="text-sm text-slate-600">Gravando áudio... {formatRecordingTime(recordingSeconds)}</span>
            </div>
            <button
              onClick={stopRecording}
              title="Parar gravação"
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-white rounded-full transition-opacity"
              style={{ background: '#00a884' }}
            >
              <Square size={14} fill="white" />
            </button>
          </div>
        ) : recordedBlob ? (
          <div className="flex items-center gap-3 p-3">
            <button
              onClick={discardRecording}
              disabled={sendAudioMutation.isPending}
              title="Apagar gravação"
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
            >
              <Trash2 size={16} />
            </button>
            <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls src={recordedUrl ?? undefined} className="w-full h-9" />
            </div>
            <button
              onClick={confirmSendRecording}
              disabled={sendAudioMutation.isPending}
              title="Enviar áudio"
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-white rounded-full disabled:opacity-40 transition-opacity"
              style={{ background: '#00a884' }}
            >
              {sendAudioMutation.isPending
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <SendHorizonal size={16} />}
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-2 p-3">
            <button
              onClick={() => setShowQuickReplies((v) => !v)}
              title="Respostas rápidas"
              className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full transition-colors ${quickRepliesOpen ? 'bg-amber-50 text-amber-600' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              <Zap size={16} />
            </button>
            <textarea
              ref={textareaRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma mensagem... (Enter para enviar, / pra respostas rápidas)"
              rows={1}
              className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-colors max-h-32 overflow-y-auto"
              style={{ minHeight: '42px' }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 128) + 'px';
              }}
            />
            {texto.trim() ? (
              <button
                onClick={handleSend}
                disabled={sendMutation.isPending}
                className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-white rounded-full disabled:opacity-40 transition-opacity"
                style={{ background: '#00a884' }}
              >
                {sendMutation.isPending
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <SendHorizonal size={16} />}
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={sendAudioMutation.isPending}
                title="Gravar áudio"
                className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-white rounded-full disabled:opacity-40 transition-opacity"
                style={{ background: '#00a884' }}
              >
                {sendAudioMutation.isPending
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Mic size={16} />}
              </button>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5 px-3 pb-2.5">
          <Clock size={10} className="text-slate-300" />
          <p className="text-[10px] text-slate-300">Texto livre apenas dentro de 24h após o cliente responder • Shift+Enter para quebrar linha</p>
        </div>
      </div>
    </div>
  );
}
