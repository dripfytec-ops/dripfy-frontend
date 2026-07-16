import { useQuery } from '@tanstack/react-query';
import api from './api';
import {
  CanalDM, CampanhaDM, CampanhaDetalhesDM, TemplateDM, StatusCanalDM,
} from '@/types';

export const useCanaisDM = () => useQuery<CanalDM[]>({
  queryKey: ['dm-canais'],
  queryFn: () => api.get('/disparo-massa/canais').then((r) => r.data),
});

export const useStatusCanaisDM = () => useQuery<StatusCanalDM[]>({
  queryKey: ['dm-status-canais'],
  queryFn: () => api.get('/disparo-massa/status-canais').then((r) => r.data),
  staleTime: 5 * 60_000,
  refetchInterval: 5 * 60_000,
});

export async function createCanalDM(data: {
  nome: string; waba_id: string; phone_number_id: string; access_token: string;
  bm_nome?: string; lote_size?: number; delay_ms?: number;
}): Promise<CanalDM> {
  return api.post('/disparo-massa/canais', data).then((r) => r.data);
}

export async function updateCanalDM(id: string, data: Partial<{
  nome: string; waba_id: string; phone_number_id: string; access_token: string;
  bm_nome: string; lote_size: number; delay_ms: number; ativo: boolean;
}>): Promise<CanalDM> {
  return api.patch(`/disparo-massa/canais/${id}`, data).then((r) => r.data);
}

export async function fetchTemplatesDM(canalId: string): Promise<TemplateDM[]> {
  return api.get('/disparo-massa/templates', { params: { canal_id: canalId } }).then((r) => r.data);
}

export const useCampanhasDM = () => useQuery<CampanhaDM[]>({
  queryKey: ['dm-campanhas'],
  queryFn: () => api.get('/disparo-massa/campanhas').then((r) => r.data),
  refetchInterval: 10_000,
});

export const useCampanhaDM = (id: string | undefined) => useQuery<CampanhaDetalhesDM>({
  queryKey: ['dm-campanha', id],
  queryFn: () => api.get(`/disparo-massa/campanhas/${id}`).then((r) => r.data),
  enabled: id != null,
  refetchInterval: 4_000,
});

export async function createCampanhaDM(data: {
  nome: string; canal_id: string; template_name: string; template_params: string[];
  header_image_url: string | null; agendado_para: string | null;
  contatos: { nome?: string; telefone: string; cpf?: string }[];
}): Promise<CampanhaDM> {
  return api.post('/disparo-massa/campanhas', data).then((r) => r.data);
}

export async function iniciarDisparoDM(campanhaId: string): Promise<void> {
  await api.post('/disparo-massa/processar', { campanha_id: campanhaId });
}

export async function pausarCampanhaDM(campanhaId: string): Promise<void> {
  await api.patch(`/disparo-massa/campanhas/${campanhaId}`, { status: 'pausada' });
}
