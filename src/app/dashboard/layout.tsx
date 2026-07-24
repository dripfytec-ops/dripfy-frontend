'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';
import { auth } from '@/lib/auth';
import { User } from '@/types';
import {
  MessageCircle, Users, Megaphone, Settings, LogOut, ChevronLeft, ChevronRight, ArrowLeftRight,
  ChevronDown, Building2, Sparkles, Radio, KeyRound, Zap, Tag, MessageSquareText,
} from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getInitials, getAvatarColor } from '@/lib/avatar';

interface NavChild {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  adminOnly: boolean;
  children?: NavChild[];
}

const NAV_BASE: NavItem[] = [
  { href: '/dashboard', icon: MessageCircle, label: 'Chat', adminOnly: false },
  {
    href: '/dashboard/campaigns', icon: Megaphone, label: 'Disparo em Massa', adminOnly: false,
    children: [
      { href: '/dashboard/campaigns', label: 'Disparo Próprio', icon: Building2 },
      { href: '/dashboard/campaigns/dripify', label: 'Disparo Dripfy', icon: Sparkles },
    ],
  },
  {
    href: '/dashboard/settings', icon: Settings, label: 'Configurações', adminOnly: true,
    children: [
      { href: '/dashboard/settings/equipe', label: 'Equipe', icon: Users },
      { href: '/dashboard/settings/canais', label: 'Gerenciar Canais', icon: Radio },
      { href: '/dashboard/settings/tokens', label: 'Tokens Meta', icon: KeyRound },
      { href: '/dashboard/settings/respostas-rapidas', label: 'Respostas Rápidas', icon: Zap },
      { href: '/dashboard/settings/etiquetas', label: 'Etiquetas', icon: Tag },
      { href: '/dashboard/settings/boas-vindas', label: 'Mensagem de Boas Vindas', icon: MessageSquareText },
    ],
  },
];

const ROLE_LABEL: Record<string, string> = {
  admin_master: 'Master',
  lojista_admin: 'Administrador',
  atendente: 'Vendedor',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedHref, setExpandedHref] = useState<string | null>(null);

  const isAdmin = user?.role === 'lojista_admin' || user?.role === 'admin_master';
  const navItems = NAV_BASE.filter((item) => !item.adminOnly || isAdmin);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.replace('/login');
      return;
    }
    setUser(auth.getUser());
    setCollapsed(localStorage.getItem('dripfy_sidebar_collapsed') === '1');
  }, [router]);

  // Mantém o grupo aberto enquanto estiver numa das suas subpáginas.
  useEffect(() => {
    const grupoAtivo = navItems.find((item) => item.children && pathname.startsWith(item.href));
    if (grupoAtivo) setExpandedHref(grupoAtivo.href);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem('dripfy_sidebar_collapsed', prev ? '0' : '1');
      return !prev;
    });
  };

  const handleLogout = () => {
    auth.clear();
    router.push('/login');
  };

  const handleVoltarAoMaster = async () => {
    const masterToken = auth.getMasterToken();
    const masterUser = auth.getMasterUser();
    if (!masterToken || !masterUser) return;
    try {
      const { data } = await api.post('/auth/voltar-master');
      auth.endImpersonation(data.access_token, data.user);
      router.push('/admin/tenants');
    } catch {
      toast.error('Erro ao voltar para o Master.');
    }
  };

  if (!user) return null;

  const impersonating = auth.isImpersonating();

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {impersonating && (
        <div className="h-9 flex-shrink-0 flex items-center justify-center gap-2 bg-amber-500 text-white text-xs font-medium px-4">
          <span>Você está navegando como <strong>{user.tenant.nome_empresa}</strong></span>
          <button
            onClick={handleVoltarAoMaster}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-md transition-colors"
          >
            <ArrowLeftRight size={11} /> Voltar ao Master
          </button>
        </div>
      )}
      <div className="flex-1 flex min-h-0 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`relative flex-shrink-0 flex flex-col transition-[width] duration-200 ${collapsed ? 'w-[68px]' : 'w-60'}`}
        style={{ background: '#0f1b3d' }}
      >
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-colors z-10"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Logo variant="mark" size={30} />
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-white font-bold leading-tight truncate">Dripfy</p>
                <p className="text-white/40 text-xs truncate">{user.tenant.nome_empresa}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            if (!item.children) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${collapsed ? 'justify-center' : ''} ${
                    pathname === item.href
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                  }`}
                >
                  <item.icon size={17} strokeWidth={1.75} />
                  {!collapsed && item.label}
                </Link>
              );
            }

            const isExpanded = expandedHref === item.href;
            const isGroupActive = pathname.startsWith(item.href);

            return (
              <div key={item.href}>
                <button
                  onClick={() => {
                    if (collapsed) { router.push(item.children![0].href); return; }
                    setExpandedHref((prev) => (prev === item.href ? null : item.href));
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${collapsed ? 'justify-center' : ''} ${
                    isGroupActive ? 'text-white font-medium' : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                  }`}
                >
                  <item.icon size={17} strokeWidth={1.75} />
                  {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                  {!collapsed && (
                    <ChevronDown size={13} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  )}
                </button>
                {!collapsed && isExpanded && (
                  <div className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-0.5">
                    {item.children.map((child) => {
                      const isChildActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                            isChildActive ? 'bg-white/10 text-white font-medium' : 'text-white/40 hover:bg-white/5 hover:text-white/70'
                          }`}
                        >
                          <child.icon size={14} strokeWidth={1.75} />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="px-3 pb-4 pt-3 border-t border-white/10">
          <div className={`flex items-center gap-2.5 px-2 py-2 mb-2 ${collapsed ? 'justify-center' : ''}`}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
              style={{ background: getAvatarColor(user.nome) }}
              title={collapsed ? user.nome : undefined}
            >
              {getInitials(user.nome)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.nome}</p>
                <p className="text-white/40 text-xs truncate">{ROLE_LABEL[user.role] || user.role}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title={collapsed ? 'Sair' : undefined}
            className={`flex items-center justify-center gap-2 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 text-sm px-3 py-2 w-full rounded-lg transition-colors ${collapsed ? 'px-0' : ''}`}
          >
            <LogOut size={15} strokeWidth={1.75} />
            {!collapsed && 'Sair'}
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-700">
            {navItems.flatMap((item) => (item.children ? [item, ...item.children] : [item])).find((item) => item.href === pathname)?.label ?? 'Dripfy'}
          </h2>
          <p className="text-xs text-gray-400 capitalize">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </header>
        <div className="flex-1 overflow-auto min-h-0">
          {children}
        </div>
      </main>
      </div>
    </div>
  );
}
