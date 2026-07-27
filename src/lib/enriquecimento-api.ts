import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { EnriquecimentoSolicitacao, EnriquecimentoSaldoExtrato, EnriquecimentoCompraCredito } from '@/types';

export const useEnriquecimentos = () =>
  useQuery<EnriquecimentoSolicitacao[]>({
    queryKey: ['enriquecimento'],
    queryFn: () => api.get('/enriquecimento').then((r) => r.data),
  });

export const useSaldoEnriquecimento = () =>
  useQuery<EnriquecimentoSaldoExtrato>({
    queryKey: ['enriquecimento', 'saldo'],
    queryFn: () => api.get('/enriquecimento/saldo').then((r) => r.data),
  });

export const useUploadEnriquecimento = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, quantidadeLeads, observacoes }: { file: File; quantidadeLeads: number; observacoes?: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('quantidade_leads', String(quantidadeLeads));
      if (observacoes) formData.append('observacoes', observacoes);
      return api.post('/enriquecimento/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enriquecimento'] });
      queryClient.invalidateQueries({ queryKey: ['enriquecimento', 'saldo'] });
    },
  });
};

export const useComprarCreditosEnriquecimento = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quantidade: number) => api.post('/enriquecimento/comprar-creditos', { quantidade }).then((r) => r.data as EnriquecimentoCompraCredito),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enriquecimento', 'saldo'] }),
  });
};

// [Master]
export const useEnriquecimentosAdmin = () =>
  useQuery<EnriquecimentoSolicitacao[]>({
    queryKey: ['enriquecimento', 'admin'],
    queryFn: () => api.get('/admin/enriquecimento').then((r) => r.data),
  });

export const useConcluirEnriquecimento = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post(`/admin/enriquecimento/${id}/concluir`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enriquecimento', 'admin'] }),
  });
};

export const useComprasEnriquecimentoAdmin = () =>
  useQuery<EnriquecimentoCompraCredito[]>({
    queryKey: ['enriquecimento', 'admin', 'compras'],
    queryFn: () => api.get('/admin/enriquecimento/compras').then((r) => r.data),
  });

export const useConfirmarPagamentoCompraEnriquecimento = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/admin/enriquecimento/compras/${id}/confirmar-pagamento`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enriquecimento', 'admin', 'compras'] }),
  });
};
