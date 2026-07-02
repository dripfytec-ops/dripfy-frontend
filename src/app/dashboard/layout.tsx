'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { User } from '@/types';
import {
  LayoutDashboard, Users, Megaphone, Settings, LogOut,
  MessageSquare, Webhook,
} from 'lucide-react';

const NAV_BASE = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Leads', adminOnly: false },
  { href: '/dashboard/campaigns', icon: Megaphone, label: 'Campanhas', adminOnly: false },
  { href: '/dashboard/vendedores', icon: Users, label: 'Equipe', adminOnly: true },
  { href: '/dashboard/settings', icon: Settings, label: 'Canais', adminOnly: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  const isAdmin = user?.role === 'lojista_admin' || user?.role === 'admin_master';
  const navItems = NAV_BASE.filter((item) => !item.adminOnly || isAdmin);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.replace('/login');
      return;
    }
    setUser(auth.getUser());
  }, [router]);

  const handleLogout = () => {
    auth.clear();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💧</span>
            <div>
              <p className="text-white font-bold text-lg leading-tight">Dripfy</p>
              <p className="text-white/60 text-xs truncate">{user.tenant.nome_empresa}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-primary text-white'
                  : 'text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user.nome.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.nome}</p>
              <p className="text-white/50 text-xs truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm px-3 py-2 w-full rounded-lg hover:bg-white/10 transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
