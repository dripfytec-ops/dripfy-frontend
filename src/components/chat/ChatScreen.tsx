'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { Etiqueta, Lead, Vendedor } from '@/types';
import ConversationList from './ConversationList';
import ChatThread from './ChatThread';
import ContactDetails from './ContactDetails';
import NewConversationModal from './NewConversationModal';

interface Props {
  etiquetas: Etiqueta[];
  vendedores?: Vendedor[];
  isAdmin?: boolean;
}

export default function ChatScreen({ etiquetas, vendedores = [], isAdmin = false }: Props) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const queryClient = useQueryClient();

  const handleUpdated = (updated: Lead) => {
    setSelectedLead(updated);
    queryClient.invalidateQueries({ queryKey: ['leads', 'conversas'] });
  };

  const handleConversationCreated = (lead: Lead) => {
    setSelectedLead(lead);
    setShowNewConversation(false);
    queryClient.invalidateQueries({ queryKey: ['leads', 'conversas'] });
    queryClient.invalidateQueries({ queryKey: ['messages', 'lead', lead.id_number] });
  };

  return (
    <div className="card flex overflow-hidden flex-1 min-h-0">
      <ConversationList
        selectedLeadId={selectedLead?.id_number ?? null}
        onSelect={setSelectedLead}
        etiquetas={etiquetas}
        onNewConversation={() => setShowNewConversation(true)}
      />
      <div className="flex-1 min-w-0">
        {selectedLead ? (
          <ChatThread lead={selectedLead} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <MessageCircle size={40} className="opacity-30" />
            <p className="text-sm">Selecione uma conversa</p>
          </div>
        )}
      </div>
      {selectedLead && (
        <ContactDetails
          lead={selectedLead}
          etiquetas={etiquetas}
          vendedores={vendedores}
          isAdmin={isAdmin}
          onUpdated={handleUpdated}
          collapsed={detailsCollapsed}
          onToggleCollapsed={() => setDetailsCollapsed((v) => !v)}
        />
      )}
      {showNewConversation && (
        <NewConversationModal onClose={() => setShowNewConversation(false)} onCreated={handleConversationCreated} />
      )}
    </div>
  );
}
