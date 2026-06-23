'use client';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lead, LeadStatus, KanbanBoard } from '@/types';
import { GripVertical, CheckCircle2, Circle } from 'lucide-react';

interface Props {
  data?: KanbanBoard;
  loading: boolean;
  onDrop: (leadId: number, status: LeadStatus) => void;
  statusLabels: Record<LeadStatus, string>;
}

const COLUMNS: LeadStatus[] = ['balde_geral', 'aguardando_resposta', 'em_atendimento', 'finalizado'];

const COLUMN_COLORS: Record<LeadStatus, string> = {
  balde_geral: 'border-t-gray-400',
  aguardando_resposta: 'border-t-yellow-400',
  em_atendimento: 'border-t-blue-400',
  finalizado: 'border-t-green-400',
};

function LeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id_number,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`bg-white border border-gray-200 rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">{lead.nome}</p>
          <p className="text-gray-400 text-xs font-mono mt-0.5">{lead.telefone}</p>
        </div>
        <GripVertical size={14} className="text-gray-300 flex-shrink-0 mt-0.5" />
      </div>
      <div className="flex items-center gap-2 mt-2">
        {lead.disparado
          ? <CheckCircle2 size={12} className="text-green-500" />
          : <Circle size={12} className="text-gray-300" />}
        <span className="text-xs text-gray-400">#{lead.id_number}</span>
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  leads,
  label,
}: {
  status: LeadStatus;
  leads: Lead[];
  label: string;
}) {
  return (
    <div className={`card border-t-4 ${COLUMN_COLORS[status]} flex flex-col min-h-96 w-64 flex-shrink-0`}>
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-700 text-sm">{label}</h3>
          <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
            {leads.length}
          </span>
        </div>
      </div>
      <SortableContext items={leads.map((l) => l.id_number)} strategy={verticalListSortingStrategy}>
        <div className="p-3 flex flex-col gap-2 flex-1 overflow-y-auto">
          {leads.map((lead) => (
            <LeadCard key={lead.id_number} lead={lead} />
          ))}
          {leads.length === 0 && (
            <div className="text-center text-gray-300 text-xs py-8">Sem leads aqui</div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function LeadKanban({ data, loading, onDrop, statusLabels }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const findColumn = (leadId: number): LeadStatus | null => {
    for (const col of COLUMNS) {
      if (data?.[col]?.find((l) => l.id_number === leadId)) return col;
    }
    return null;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const targetCol = findColumn(Number(over.id));
    if (targetCol) {
      onDrop(Number(active.id), targetCol);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col}
            status={col}
            leads={data?.[col] || []}
            label={statusLabels[col]}
          />
        ))}
      </div>
    </DndContext>
  );
}
