'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { User } from '@/types';
import { Building2, Users, LogOut, LayoutDashboard } from 'lucide-react';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/tenants', icon: Building2, label: 'Lojistas' },
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
      <aside className="w-64 bg-slate-900 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💧</span>
            <div>
              <p className="text-white font-bold">Dripfy Master</p>
              <p className="text-white/50 text-xs">Painel Administrativo</p>
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
          <button
            onClick={() => { auth.clear(); router.push('/login'); }}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm px-3 py-2 w-full rounded-lg hover:bg-white/10"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
