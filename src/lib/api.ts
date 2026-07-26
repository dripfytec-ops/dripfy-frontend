import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('dripfy_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const ASSINATURA_BLOQUEADA_EVENT = 'assinatura-bloqueada';

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('dripfy_token');
      Cookies.remove('dripfy_user');
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    // Ação de escrita bloqueada por mensalidade em atraso (ver AssinaturaGuard
    // no backend) — dispara um popup global em vez do toast de erro padrão.
    if (error.response?.status === 402 && error.response?.data?.code === 'ASSINATURA_ATRASADA') {
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(ASSINATURA_BLOQUEADA_EVENT));
    }
    return Promise.reject(error);
  },
);

// O backend serve mídia (imagem/áudio/documento) fora do prefixo /api/v1.
export function getMediaUrl(mediaPath: string): string {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  return apiBase.replace(/\/api\/v1\/?$/, '') + mediaPath;
}

export default api;
