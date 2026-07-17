'use client';
import { useQuery } from '@tanstack/react-query';
import { Users, Send, MessageSquare, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { auth } from '@/lib/auth';
import { Etiqueta, Vendedor } from '@/types';
import ChatScreen from '@/components/chat/ChatScreen';

export default function LeadsPage() {
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

  return (
    <div className="p-6">
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

      <ChatScreen etiquetas={etiquetas} vendedores={vendedores} isAdmin={isAdmin} />
    </div>
  );
}
