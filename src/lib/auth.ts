import Cookies from 'js-cookie';
import { User } from '@/types';

const TOKEN_KEY = 'dripfy_token';
const USER_KEY = 'dripfy_user';
const MASTER_TOKEN_KEY = 'dripfy_master_token';
const MASTER_USER_KEY = 'dripfy_master_user';
const COOKIE_OPTIONS = { expires: 7, secure: process.env.NODE_ENV === 'production' };
const IMPERSONATION_COOKIE_OPTIONS = { expires: 1, secure: process.env.NODE_ENV === 'production' };

export const auth = {
  setSession(token: string, user: User) {
    Cookies.set(TOKEN_KEY, token, COOKIE_OPTIONS);
    Cookies.set(USER_KEY, JSON.stringify(user), COOKIE_OPTIONS);
  },

  getToken(): string | undefined {
    return Cookies.get(TOKEN_KEY);
  },

  getUser(): User | null {
    const raw = Cookies.get(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  isMaster(): boolean {
    return this.getUser()?.role === 'admin_master';
  },

  clear() {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(USER_KEY);
    Cookies.remove(MASTER_TOKEN_KEY);
    Cookies.remove(MASTER_USER_KEY);
  },

  // Alternar de tenant (Master "entrando como" um lojista): guarda a sessão
  // original do Master pra permitir voltar, e troca a sessão ativa pela do
  // tenant alvo.
  startImpersonation(masterToken: string, masterUser: User, impersonatedToken: string, impersonatedUser: User) {
    Cookies.set(MASTER_TOKEN_KEY, masterToken, IMPERSONATION_COOKIE_OPTIONS);
    Cookies.set(MASTER_USER_KEY, JSON.stringify(masterUser), IMPERSONATION_COOKIE_OPTIONS);
    this.setSession(impersonatedToken, impersonatedUser);
  },

  isImpersonating(): boolean {
    return !!Cookies.get(MASTER_TOKEN_KEY);
  },

  getMasterToken(): string | undefined {
    return Cookies.get(MASTER_TOKEN_KEY);
  },

  getMasterUser(): User | null {
    const raw = Cookies.get(MASTER_USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },

  endImpersonation(masterToken: string, masterUser: User) {
    Cookies.remove(MASTER_TOKEN_KEY);
    Cookies.remove(MASTER_USER_KEY);
    this.setSession(masterToken, masterUser);
  },
};
