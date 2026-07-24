'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { User } from '@/types';
import { Building2, LogOut, LayoutDashboard, Sparkles } from 'lucide-react';
import Logo from '@/components/ui/Logo';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/tenants', icon: Building2, label: 'Lojistas' },
  { href: '/admin/demandas-dripfy', icon: Sparkles, label: 'Demandas Dripfy' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const u = auth.getUser();
    if (!auth.isAuthenticated() || u?.role !== 'admin_master') {
      router.replace('/login');
      return;
    }
    setUser(u);
  }, [router]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-60 flex-shrink-0 flex flex-col" style={{ background: '#0f1b3d' }}>
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Logo variant="mark" size={30} />
            <div>
              <p className="text-white font-bold leading-tight">Dripfy</p>
              <p className="text-white/40 text-xs">Painel Administrativo</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              <item.icon size={17} strokeWidth={1.75} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 pb-4 pt-3 border-t border-white/10">
          <button
            onClick={() => { auth.clear(); router.push('/login'); }}
            className="flex items-center justify-center gap-2 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 text-sm px-3 py-2 w-full rounded-lg transition-colors"
          >
            <LogOut size={15} strokeWidth={1.75} /> Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-700">
            {navItems.find((item) => item.href === pathname)?.label ?? 'Dripfy'}
          </h2>
          <p className="text-xs text-gray-400 capitalize">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
