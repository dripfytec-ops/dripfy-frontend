'use client';
import { useState } from 'react';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, pointerWithin,
} from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { GripVertical, CheckCircle2, Circle, Settings2, Check, X, UserCircle2 } from 'lucide-react';
import { Lead, Etiqueta, KanbanBoard, Vendedor } from '@/types';
import api from '@/lib/api';

interface Props {
  data?: KanbanBoard;
  loading: boolean;
  onDrop: (leadId: number, etiquetaId: string) => void;
  vendedores?: Vendedor[];
  isAdmin: boolean;
  onSelectLead: (lead: Lead) => void;
}

function LeadCard({ lead, onSelectLead }: { lead: Lead; onSelectLead: (l: Lead) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id_number });

  return (
    <div
      ref={setNodeRef}
      className={`bg-white border border-gray-200 rounded-lg p-3 shadow-sm transition-opacity ${isDragging ? 'opacity-30' : 'opacity-100'}`}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing mt-0.5 flex-shrink-0 touch-none"
        >
          <GripVertical size={14} className="text-gray-300" />
        </div>
        <div className="flex-1 min-w-0">
          <button
            onClick={() => onSelectLead(lead)}
            className="font-medium text-gray-900 text-sm truncate hover:text-primary text-left w-full"
          >
            {lead.nome}
          </button>
          <p className="text-gray-400 text-xs font-mono mt-0.5">{lead.telefone}</p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5">
              {lead.disparado
                ? <CheckCircle2 size={11} className="text-green-500" />
                : <Circle size={11} className="text-gray-300" />}
              <span className="text-xs text-gray-400">#{lead.id_number}</span>
            </div>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <UserCircle2 size={11} />
              {lead.vendedor?.nome ?? 'Sem vendedor'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  etiqueta, leads, onSelectLead, isAdmin, onUpdateEtiqueta, isDraggingOver,
}: {
  etiqueta: Etiqueta;
  leads: Lead[];
  onSelectLead: (l: Lead) => void;
  isAdmin: boolean;
  onUpdateEtiqueta: (id: string, nome: string, cor: string) => void;
  isDraggingOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: etiqueta.id });
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState(etiqueta.nome);
  const [cor, setCor] = useState(etiqueta.cor_hexadecimal);

  const handleSave = () => {
    onUpdateEtiqueta(etiqueta.id, nome, cor);
    setEditing(false);
  };

  return (
    <div
      className={`flex flex-col w-64 flex-shrink-0 rounded-xl border transition-colors ${
        isDraggingOver
          ? 'border-primary/50 bg-primary/5 shadow-md'
          : 'border-gray-200 bg-gray-50'
      }`}
      style={{ minHeight: '24rem' }}
    >
      {/* Header */}
      <div
        className="p-3 border-b border-gray-200"
        style={{
          borderTopColor: etiqueta.cor_hexadecimal,
          borderTopWidth: 3,
          borderTopStyle: 'solid',
          borderRadius: '12px 12px 0 0',
        }}
      >
        {editing ? (
          <div className="space-y-1.5">
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full text-sm font-semibold bg-white border border-gray-300 rounded px-2 py-1 outline-none focus:border-primary"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="w-8 h-7 rounded cursor-pointer border-0"
              />
              <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded">
                <Check size={14} />
              </button>
              <button onClick={() => setEditing(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: etiqueta.cor_hexadecimal }} />
              <h3 className="font-semibold text-gray-700 text-sm">{etiqueta.nome}</h3>
            </div>
            <div className="flex items-center gap-1">
              <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">{leads.length}</span>
              {isAdmin && (
                <button
                  onClick={() => setEditing(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <Settings2 size={13} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div ref={setNodeRef} className="p-2 flex flex-col gap-2 flex-1">
        {leads.map((lead) => (
          <LeadCard key={lead.id_number} lead={lead} onSelectLead={onSelectLead} />
        ))}
        {leads.length === 0 && (
          <div className={`flex-1 flex items-center justify-center text-xs rounded-lg border-2 border-dashed min-h-24 transition-colors ${
            isDraggingOver ? 'border-primary/40 text-primary/60' : 'border-gray-200 text-gray-300'
          }`}>
            {isDraggingOver ? 'Solte aqui' : 'Sem leads'}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeadKanban({ data, loading, onDrop, isAdmin, onSelectLead }: Props) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const updateEtiqueta = useMutation({
    mutationFn: ({ id, nome, cor_hexadecimal }: { id: string; nome: string; cor_hexadecimal: string }) =>
      api.patch(`/etiquetas/${id}`, { nome, cor_hexadecimal }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Coluna atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar coluna.'),
  });

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const etiquetas = data?.etiquetas || [];
  const colunas = data?.colunas || {};
  const allLeads = Object.values(colunas).flat();
  const activeLead = activeId ? allLeads.find((l) => l.id_number === activeId) : null;

  const findEtiquetaByLeadId = (leadId: number): string | null => {
    for (const [etId, leads] of Object.entries(colunas)) {
      if (leads.find((l) => l.id_number === leadId)) return etId;
    }
    return null;
  };

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(Number(e.active.id));
  };

  const handleDragOver = (event: any) => {
    const { over } = event;
    setOverId(over ? String(over.id) : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setOverId(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = Number(active.id);
    const targetEtiquetaId = String(over.id);

    // over.id deve ser um etiqueta ID (coluna droppable)
    const isValidColumn = etiquetas.some((et) => et.id === targetEtiquetaId);
    if (!isValidColumn) return;

    const sourceEtiquetaId = findEtiquetaByLeadId(leadId);
    if (sourceEtiquetaId === targetEtiquetaId) return; // mesma coluna, nada a fazer

    onDrop(leadId, targetEtiquetaId);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {etiquetas.map((et) => (
          <KanbanColumn
            key={et.id}
            etiqueta={et}
            leads={colunas[et.id] || []}
            onSelectLead={onSelectLead}
            isAdmin={isAdmin}
            isDraggingOver={activeId !== null && overId === et.id}
            onUpdateEtiqueta={(id, nome, cor) => updateEtiqueta.mutate({ id, nome, cor_hexadecimal: cor })}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeLead && (
          <div className="bg-white border-2 border-primary/30 rounded-lg p-3 shadow-xl w-60 rotate-1">
            <p className="font-medium text-sm text-gray-900">{activeLead.nome}</p>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{activeLead.telefone}</p>
            {activeLead.vendedor && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <UserCircle2 size={11} /> {activeLead.vendedor.nome}
              </p>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
