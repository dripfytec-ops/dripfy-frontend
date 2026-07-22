'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { auth } from '@/lib/auth';
import { Etiqueta, Vendedor } from '@/types';
import ChatScreen from '@/components/chat/ChatScreen';

export default function LeadsPage() {
  const user = auth.getUser();
  const isAdmin = user?.role === 'lojista_admin' || user?.role === 'admin_master';

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
    <div className="p-6 h-full flex flex-col">
      <ChatScreen etiquetas={etiquetas} vendedores={vendedores} isAdmin={isAdmin} />
    </div>
  );
}
