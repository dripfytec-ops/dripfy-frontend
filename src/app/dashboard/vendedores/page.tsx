'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, X, Save, KeyRound,
  CheckCircle2, XCircle, UserCircle2, ShieldCheck, Eye, EyeOff,
} from 'lucide-react';
import api from '@/lib/api';
import { auth } from '@/lib/auth';
import { TeamMember } from '@/types';

const ROLE_LABEL: Record<string, string> = {
  lojista_admin: 'Admin',
  atendente: 'Vendedor',
  admin_master: 'Master',
};

const ROLE_COLOR: Record<string, string> = {
  lojista_admin: 'bg-purple-50 text-purple-700',
  atendente: 'bg-blue-50 text-blue-700',
  admin_master: 'bg-red-50 text-red-700',
};

const EMPTY_FORM = { nome: '', email: '', password: '', role: 'atendente' as string };

function MemberModal({
  member,
  onClose,
}: {
  member: TeamMember | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(
    member
      ? { nome: member.nome, email: member.email, password: '', role: member.role }
      : EMPTY_FORM,
  );
  const [showPw, setShowPw] = useState(false);

  const createMutation = useMutation({
    mutationFn: () => api.post('/users', { nome: form.nome, email: form.email, password: form.password, role: form.role }),
    onSuccess: () => {
      toast.success('Vendedor criado!');
      queryClient.invalidateQueries({ queryKey: ['team'] });
      onClose();
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Erro ao criar vendedor.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => api.patch(`/users/${member!.id}`, { nome: form.nome, email: form.email }),
    onSuccess: () => {
      toast.success('Dados atualizados!');
      queryClient.invalidateQueries({ queryKey: ['team'] });
      onClose();
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Erro ao atualizar.');
    },
  });

  const resetPwMutation = useMutation({
    mutationFn: () => api.patch(`/users/${member!.id}/reset-password`, { new_password: form.password }),
    onSuccess: () => {
      toast.success('Senha redefinida!');
      setForm((p) => ({ ...p, password: '' }));
    },
    onError: () => toast.error('Erro ao redefinir senha.'),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    if (!form.nome.trim() || !form.email.trim()) return toast.error('Nome e e-mail são obrigatórios.');
    if (!member && !form.password.trim()) return toast.error('Senha é obrigatória para novo vendedor.');
    if (member) updateMutation.mutate();
    else createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 text-lg">
            {member ? 'Editar Vendedor' : 'Novo Vendedor'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome completo</label>
            <input
              value={form.nome}
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
              className="input"
              placeholder="João Silva"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="input"
              placeholder="joao@empresa.com"
            />
          </div>

          {!member && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Perfil</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  className="input"
                >
                  <option value="atendente">Vendedor (atendente)</option>
                  <option value="lojista_admin">Admin da loja</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Senha inicial</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    className="input pr-10"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {member && (
            <div className="pt-1 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                <KeyRound size={12} /> Redefinir senha
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    className="input pr-10 text-sm"
                    placeholder="Nova senha..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button
                  onClick={() => { if (form.password.trim()) resetPwMutation.mutate(); }}
                  disabled={!form.password.trim() || resetPwMutation.isPending}
                  className="px-3 py-2 text-xs font-medium bg-amber-500 text-white rounded-lg disabled:opacity-40 hover:bg-amber-600 transition-colors whitespace-nowrap"
                >
                  {resetPwMutation.isPending ? '...' : 'Redefinir'}
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-outline flex-1 text-sm">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
            >
              <Save size={14} />
              {isPending ? 'Salvando...' : member ? 'Salvar alterações' : 'Criar vendedor'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VendedoresPage() {
  const queryClient = useQueryClient();
  const user = auth.getUser();
  const [modal, setModal] = useState<{ open: boolean; member: TeamMember | null }>({ open: false, member: null });

  const { data: members = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ['team'],
    queryFn: async () => (await api.get('/users')).data,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/toggle`),
    onSuccess: (_, id) => {
      const m = members.find((x) => x.id === id);
      toast.success(m?.ativo ? 'Vendedor desativado.' : 'Vendedor ativado!');
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
    onError: () => toast.error('Erro ao alterar status.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success('Vendedor removido.');
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message;
      toast.error(msg || 'Erro ao remover vendedor.');
    },
  });

  const handleDelete = (member: TeamMember) => {
    if (!confirm(`Remover ${member.nome}? Esta ação não pode ser desfeita.`)) return;
    deleteMutation.mutate(member.id);
  };

  const ativos = members.filter((m) => m.ativo);
  const inativos = members.filter((m) => !m.ativo);

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipe</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gerencie os vendedores e admins da sua loja</p>
        </div>
        <button
          onClick={() => setModal({ open: true, member: null })}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> Novo Vendedor
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: members.length, color: 'text-gray-900' },
          { label: 'Ativos', value: ativos.length, color: 'text-green-600' },
          { label: 'Inativos', value: inativos.length, color: 'text-gray-400' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <UserCircle2 size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Nenhum membro cadastrado</p>
          <p className="text-gray-400 text-sm mt-1">Crie o primeiro vendedor para começar a atribuir leads</p>
          <button
            onClick={() => setModal({ open: true, member: null })}
            className="mt-4 btn-primary text-sm"
          >
            Criar primeiro vendedor
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vendedor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">E-mail</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Perfil</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cadastro</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => {
                const isMe = member.id === user?.id;
                return (
                  <tr key={member.id} className={`hover:bg-gray-50 transition-colors ${!member.ativo ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary text-xs font-bold">{member.nome.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.nome}</p>
                          {isMe && <p className="text-[10px] text-primary font-medium">Você</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{member.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLOR[member.role] || 'bg-gray-100 text-gray-600'}`}>
                        {member.role === 'lojista_admin' && <ShieldCheck size={10} />}
                        {ROLE_LABEL[member.role] || member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => !isMe && toggleMutation.mutate(member.id)}
                        disabled={isMe || toggleMutation.isPending}
                        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                          isMe ? 'cursor-default' :
                          member.ativo
                            ? 'text-green-700 bg-green-50 hover:bg-green-100'
                            : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {member.ativo
                          ? <><CheckCircle2 size={12} /> Ativo</>
                          : <><XCircle size={12} /> Inativo</>}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(member.criado_em).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setModal({ open: true, member })}
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        {!isMe && (
                          <button
                            onClick={() => handleDelete(member)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <MemberModal
          member={modal.member}
          onClose={() => setModal({ open: false, member: null })}
        />
      )}
    </div>
  );
}
