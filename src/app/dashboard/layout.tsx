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
import Logo from '@/components/ui/Logo';

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
      <aside className="w-52 bg-slate-950 flex flex-col border-r border-white/5">
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Logo variant="mark" size={22} />
            <div>
              <p className="text-white text-sm tracking-tight" style={{ fontWeight: 500 }}>Dripfy</p>
              <p className="text-white/40 text-[11px] truncate">{user.tenant.nome_empresa}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                pathname === item.href
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <item.icon size={15} strokeWidth={1.5} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-4 border-t border-white/5 pt-3">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-white text-xs">
              {user.nome.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-[12px] truncate">{user.nome}</p>
              <p className="text-white/30 text-[10px] truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/30 hover:text-white/70 text-[12px] px-3 py-1.5 w-full rounded-lg hover:bg-white/5 transition-colors"
          >
            <LogOut size={13} strokeWidth={1.5} />
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
