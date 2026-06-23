import Cookies from 'js-cookie';
import { User } from '@/types';

const TOKEN_KEY = 'dripfy_token';
const USER_KEY = 'dripfy_user';
const COOKIE_OPTIONS = { expires: 7, secure: process.env.NODE_ENV === 'production' };

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
  },
};
