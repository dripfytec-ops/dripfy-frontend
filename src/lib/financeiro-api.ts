import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { Invoice, ExtratoCreditos } from '@/types';

export async function comprarCreditos(data: { quantidade_creditos: number; valor_total: number }): Promise<Invoice> {
  return api.post('/financeiro/comprar-creditos', data).then((r) => r.data);
}

// Gera cobrança PIX com valor fixo (sem depender do gateway automático).
export const useComprarCreditosManual = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quantidade: number) => api.post('/financeiro/comprar-creditos-manual', { quantidade }).then((r) => r.data as Invoice),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financeiro', 'extrato'] }),
  });
};

// [Master] Cobranças pendentes de créditos Dripfy de um tenant.
export const useInvoicesPendentesTenant = (tenantId: string | null) =>
  useQuery<Invoice[]>({
    queryKey: ['financeiro', 'invoices-pendentes', tenantId],
    queryFn: () => api.get(`/tenants/${tenantId}/invoices-pendentes`).then((r) => r.data),
    enabled: !!tenantId,
  });

// [Master] Confirma manualmente o pagamento de uma cobrança de créditos Dripfy.
export const useConfirmarPagamentoInvoice = (tenantId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => api.patch(`/tenants/${tenantId}/invoices/${invoiceId}/confirmar-pagamento`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeiro', 'invoices-pendentes', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['financeiro', 'extrato', tenantId] });
    },
  });
};

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

export const useExtratoCreditos = () =>
  useQuery<ExtratoCreditos>({
    queryKey: ['financeiro', 'extrato'],
    queryFn: () => api.get('/financeiro/extrato').then((r) => r.data),
  });

// [Master] Extrato de créditos de um tenant específico.
export const useExtratoCreditosTenant = (tenantId: string | null) =>
  useQuery<ExtratoCreditos>({
    queryKey: ['financeiro', 'extrato', tenantId],
    queryFn: () => api.get(`/tenants/${tenantId}/extrato`).then((r) => r.data),
    enabled: !!tenantId,
  });
