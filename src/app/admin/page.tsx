'use client';
import { useQuery } from '@tanstack/react-query';
import { Building2, Users, Layers } from 'lucide-react';
import api from '@/lib/api';
import { Tenant } from '@/types';

export default function AdminDashboard() {
  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: async () => (await api.get('/tenants')).data,
  });

  const totalLeads = tenants.reduce((acc, t) => acc + (t._count?.leads || 0), 0);
  const totalUsers = tenants.reduce((acc, t) => acc + (t._count?.users || 0), 0);
  const ativos = tenants.filter((t) => t.status_assinatura === 'ativo').length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Master</h1>
        <p className="text-gray-500 text-sm">Visão geral da plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center">
            <Building2 size={22} className="text-brand" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{tenants.length}</p>
            <p className="text-gray-500 text-sm">Lojistas ({ativos} ativos)</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <Users size={22} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
            <p className="text-gray-500 text-sm">Usuários totais</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
            <Layers size={22} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalLeads.toLocaleString('pt-BR')}</p>
            <p className="text-gray-500 text-sm">Leads na plataforma</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Lojistas Recentes</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Empresa</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Leads</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tenants.slice(0, 10).map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{t.nome_empresa}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">/{t.slug}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    t.status_assinatura === 'ativo' ? 'bg-green-100 text-green-700' :
                    t.status_assinatura === 'trial' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {t.status_assinatura}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{t._count?.leads || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
