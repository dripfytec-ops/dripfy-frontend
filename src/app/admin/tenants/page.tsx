'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, Building2, Users, LayoutList } from 'lucide-react';
import api from '@/lib/api';
import { Tenant } from '@/types';

const schema = z.object({
  nome_empresa: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
  admin_nome: z.string().min(2),
  admin_email: z.string().email(),
  admin_password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

const STATUS_BADGE: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  inativo: 'bg-red-100 text-red-700',
  trial: 'bg-yellow-100 text-yellow-700',
};

export default function TenantsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: tenants = [], isLoading } = useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: async () => (await api.get('/tenants')).data,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const create = useMutation({
    mutationFn: (data: FormData) => api.post('/tenants', data),
    onSuccess: () => {
      toast.success('Lojista criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setModalOpen(false);
      reset();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro ao criar lojista.'),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lojistas</h1>
          <p className="text-gray-500 text-sm">Gerencie os tenants da plataforma</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo Lojista
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">
                  <Building2 size={20} className="text-brand" />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_BADGE[tenant.status_assinatura]}`}>
                  {tenant.status_assinatura}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900">{tenant.nome_empresa}</h3>
              <p className="text-gray-400 text-xs font-mono mt-0.5">/{tenant.slug}</p>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Users size={13} />
                  {tenant._count?.users || 0} usuários
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <LayoutList size={13} />
                  {tenant._count?.leads || 0} leads
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-lg">Novo Lojista</h2>
              <button onClick={() => { setModalOpen(false); reset(); }}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit((d) => create.mutate(d))} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome da Empresa</label>
                <input {...register('nome_empresa')} className="input" placeholder="Loja do João" />
                {errors.nome_empresa && <p className="text-red-500 text-xs mt-0.5">{errors.nome_empresa.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Slug (URL)</label>
                <input {...register('slug')} className="input" placeholder="loja-do-joao" />
                {errors.slug && <p className="text-red-500 text-xs mt-0.5">{errors.slug.message}</p>}
              </div>
              <hr className="border-gray-100" />
              <p className="text-xs text-gray-500 font-medium">Admin do Lojista</p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
                <input {...register('admin_nome')} className="input" placeholder="João Silva" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
                <input {...register('admin_email')} type="email" className="input" placeholder="joao@empresa.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Senha inicial</label>
                <input {...register('admin_password')} type="password" className="input" placeholder="••••••••" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setModalOpen(false); reset(); }} className="btn-outline flex-1">Cancelar</button>
                <button type="submit" disabled={create.isPending} className="btn-primary flex-1">
                  {create.isPending ? 'Criando...' : 'Criar Lojista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
