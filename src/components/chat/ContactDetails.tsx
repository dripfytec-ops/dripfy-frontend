'use client';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PhoneIncoming, IdCard, Phone, CalendarDays, Tag, UserCircle2, Pencil, Check, X, ChevronRight, ChevronLeft, Megaphone } from 'lucide-react';
import api from '@/lib/api';
import { Lead, Etiqueta, Vendedor } from '@/types';
import { getInitials, getAvatarColor } from '@/lib/avatar';

interface Props {
  lead: Lead;
  etiquetas: Etiqueta[];
  vendedores: Vendedor[];
  isAdmin: boolean;
  onUpdated: (lead: Lead) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

function formatCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function Field({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}

function EditField({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="text-gray-400 mt-2 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <label className="text-[11px] text-gray-400">{label}</label>
        {children}
      </div>
    </div>
  );
}

export default function ContactDetails({ lead, etiquetas, vendedores, isAdmin, onUpdated, collapsed, onToggleCollapsed }: Props) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState(lead.nome);
  const [telefone, setTelefone] = useState(lead.telefone);
  const [cpf, setCpf] = useState(lead.cpf || '');
  const [etiquetaIds, setEtiquetaIds] = useState(lead.etiquetas.map((e) => e.id));
  const [vendedorId, setVendedorId] = useState(lead.vendedor_id || '');

  useEffect(() => {
    setNome(lead.nome);
    setTelefone(lead.telefone);
    setCpf(lead.cpf || '');
    setEtiquetaIds(lead.etiquetas.map((e) => e.id));
    setVendedorId(lead.vendedor_id || '');
    setEditing(false);
  }, [lead.id_number]);

  const startEdit = () => setEditing(true);
  const cancelEdit = () => {
    setNome(lead.nome);
    setTelefone(lead.telefone);
    setCpf(lead.cpf || '');
    setEtiquetaIds(lead.etiquetas.map((e) => e.id));
    setVendedorId(lead.vendedor_id || '');
    setEditing(false);
  };

  const toggleEtiqueta = (id: string) => {
    setEtiquetaIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const sameSet = (a: string[], b: string[]) => a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const calls: Promise<any>[] = [
        api.patch(`/leads/${lead.id_number}`, { nome, telefone, cpf: cpf || null }),
      ];
      const etiquetasMudaram = !sameSet(etiquetaIds, lead.etiquetas.map((e) => e.id));
      if (etiquetasMudaram) {
        calls.push(api.put(`/leads/${lead.id_number}/etiquetas`, { etiqueta_ids: etiquetaIds }));
      }
      const vendedorMudou = isAdmin && vendedorId !== (lead.vendedor_id || '');
      if (vendedorMudou) {
        calls.push(api.patch(`/leads/${lead.id_number}/vendedor`, { vendedor_id: vendedorId || null }));
      }
      await Promise.all(calls);

      if (etiquetasMudaram || vendedorMudou) {
        queryClient.invalidateQueries({ queryKey: ['leads', 'activities', lead.id_number] });
      }

      const novasEtiquetas = etiquetas.filter((e) => etiquetaIds.includes(e.id));
      const novoVendedor = vendedores.find((v) => v.id === vendedorId);
      onUpdated({
        ...lead,
        nome,
        telefone,
        cpf: cpf || undefined,
        etiquetas: novasEtiquetas,
        vendedor_id: vendedorId || undefined,
        vendedor: novoVendedor,
      });
      toast.success('Contato atualizado!');
      setEditing(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao salvar contato.');
    } finally {
      setSaving(false);
    }
  };

  if (collapsed) {
    return (
      <div className="w-12 shrink-0 flex flex-col items-center border-l border-gray-200 bg-white py-3.5 gap-3">
        <button
          onClick={onToggleCollapsed}
          title="Expandir dados do contato"
          className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
          style={{ background: getAvatarColor(lead.nome) }}
          title={lead.nome}
        >
          {getInitials(lead.nome)}
        </span>
      </div>
    );
  }

  return (
    <div className="w-[280px] shrink-0 flex flex-col border-l border-gray-200 bg-white overflow-y-auto min-h-0">
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleCollapsed}
            title="Recolher dados do contato"
            className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
          >
            <ChevronRight size={15} />
          </button>
          <h2 className="text-base font-bold text-gray-900">Contato</h2>
        </div>
        {!editing ? (
          <button onClick={startEdit} className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors">
            <Pencil size={15} />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button onClick={handleSave} disabled={saving} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50">
              <Check size={16} />
            </button>
            <button onClick={cancelEdit} disabled={saving} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center text-center px-4 py-6 border-b border-gray-100">
        <span
          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-xl flex-shrink-0"
          style={{ background: getAvatarColor(lead.nome) }}
        >
          {getInitials(lead.nome)}
        </span>
        {editing ? (
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="input text-center mt-3 text-sm font-semibold"
            placeholder="Nome completo"
          />
        ) : (
          <p className="font-semibold text-gray-900 mt-3">{lead.nome}</p>
        )}
        {lead.iniciado_pelo_cliente && (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-600 mt-1.5">
            <PhoneIncoming size={11} /> Cliente iniciou
          </span>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        {editing ? (
          <>
            <EditField icon={Phone} label="Telefone">
              <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className="input mt-1 text-sm" />
            </EditField>
            <EditField icon={IdCard} label="CPF">
              <input value={cpf} onChange={(e) => setCpf(e.target.value)} className="input mt-1 text-sm" placeholder="Não informado" />
            </EditField>
            <EditField icon={Tag} label="Etiquetas">
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {etiquetas.length === 0 && <p className="text-xs text-gray-400">Nenhuma etiqueta cadastrada.</p>}
                {etiquetas.map((et) => {
                  const selected = etiquetaIds.includes(et.id);
                  return (
                    <button
                      key={et.id}
                      type="button"
                      onClick={() => toggleEtiqueta(et.id)}
                      className="px-2 py-1 rounded-full text-xs font-medium border transition-colors"
                      style={selected
                        ? { backgroundColor: et.cor_hexadecimal + '20', color: et.cor_hexadecimal, borderColor: et.cor_hexadecimal + '60' }
                        : { backgroundColor: 'transparent', color: '#9CA3AF', borderColor: '#E5E7EB' }}
                    >
                      {et.nome}
                    </button>
                  );
                })}
              </div>
            </EditField>
            {isAdmin && (
              <EditField icon={UserCircle2} label="Vendedor">
                <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)} className="input mt-1 text-sm">
                  <option value="">Sem vendedor</option>
                  {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
                </select>
              </EditField>
            )}
          </>
        ) : (
          <>
            <Field icon={Phone} label="Telefone" value={lead.telefone} />
            <Field icon={IdCard} label="CPF" value={lead.cpf ? formatCpf(lead.cpf) : 'Não informado'} />
            <div className="flex items-start gap-2.5">
              <Tag size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400">Etiquetas</p>
                {lead.etiquetas.length === 0 ? (
                  <p className="text-sm text-gray-800">Sem etiqueta</p>
                ) : (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {lead.etiquetas.map((et) => (
                      <span
                        key={et.id}
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: et.cor_hexadecimal + '20', color: et.cor_hexadecimal }}
                      >
                        {et.nome}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Field icon={UserCircle2} label="Vendedor" value={lead.vendedor?.nome || 'Sem vendedor'} />
          </>
        )}
        {lead.origem_campanha_nome && (
          <Field icon={Megaphone} label="Veio da campanha" value={lead.origem_campanha_nome} />
        )}
        <Field icon={CalendarDays} label="Cadastrado em" value={formatDate(lead.criado_em)} />
      </div>
    </div>
  );
}
