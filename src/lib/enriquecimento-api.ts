import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { EnriquecimentoSolicitacao } from '@/types';

export const useEnriquecimentos = () =>
  useQuery<EnriquecimentoSolicitacao[]>({
    queryKey: ['enriquecimento'],
    queryFn: () => api.get('/enriquecimento').then((r) => r.data),
  });

export const useUploadEnriquecimento = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, observacoes }: { file: File; observacoes?: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (observacoes) formData.append('observacoes', observacoes);
      return api.post('/enriquecimento/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enriquecimento'] }),
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
