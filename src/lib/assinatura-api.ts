import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { MensalidadeResumo, CampanhaResumoTenant } from '@/types';

// Status da própria assinatura (lojista) — plano, usuários, valor mensal e fatura pendente.
export const useAssinaturaStatus = () =>
  useQuery<MensalidadeResumo>({
    queryKey: ['assinatura', 'status'],
    queryFn: () => api.get('/assinatura/status').then((r) => r.data),
  });

// [Master] Resumo de plano/mensalidade de um tenant específico.
export const useMensalidadeTenant = (tenantId: string | null) =>
  useQuery<MensalidadeResumo>({
    queryKey: ['assinatura', 'mensalidade', tenantId],
    queryFn: () => api.get(`/tenants/${tenantId}/mensalidade`).then((r) => r.data),
    enabled: !!tenantId,
  });

// [Master] Campanhas (Disparo Próprio + Dripfy) de um tenant específico.
export const useCampanhasTenant = (tenantId: string | null) =>
  useQuery<CampanhaResumoTenant[]>({
    queryKey: ['assinatura', 'campanhas', tenantId],
    queryFn: () => api.get(`/tenants/${tenantId}/campanhas`).then((r) => r.data),
    enabled: !!tenantId,
  });

// [Master] Ajusta manualmente o plano (valores/usuários inclusos) de um tenant.
export const useAtualizarPlano = (tenantId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { usuarios_inclusos?: number; valor_mensalidade_base?: number; valor_usuario_adicional?: number }) =>
      api.patch(`/tenants/${tenantId}/plano`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assinatura', 'mensalidade', tenantId] });
    },
  });
};

// [Master] Confirma manualmente o pagamento de uma fatura de mensalidade.
export const useConfirmarPagamentoMensalidade = (tenantId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (faturaId: string) => api.patch(`/tenants/${tenantId}/faturas/${faturaId}/confirmar-pagamento`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assinatura', 'mensalidade', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
};
