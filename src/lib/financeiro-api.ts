import { useQuery } from '@tanstack/react-query';
import api from './api';
import { Invoice } from '@/types';

export async function comprarCreditos(data: { quantidade_creditos: number; valor_total: number }): Promise<Invoice> {
  return api.post('/financeiro/comprar-creditos', data).then((r) => r.data);
}

export const useInvoiceStatus = (invoiceId: string | null, opts?: { enabled?: boolean; refetchInterval?: number }) =>
  useQuery<Invoice>({
    queryKey: ['financeiro', 'invoice', invoiceId],
    queryFn: () => api.get(`/financeiro/invoices/${invoiceId}`).then((r) => r.data),
    enabled: !!invoiceId && (opts?.enabled ?? true),
    refetchInterval: opts?.refetchInterval ?? 4000,
  });

export const useSaldoCreditos = () =>
  useQuery<{ creditos_saldo: number }>({
    queryKey: ['financeiro', 'saldo'],
    queryFn: () => api.get('/financeiro/saldo').then((r) => r.data),
  });
