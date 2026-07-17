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

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('dripfy_token');
      Cookies.remove('dripfy_user');
      if (typeof window !== 'undefined') window.location.href = '/login';
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
