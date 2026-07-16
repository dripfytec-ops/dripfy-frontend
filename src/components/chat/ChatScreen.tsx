'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { Etiqueta, Lead, Vendedor } from '@/types';
import ConversationList from './ConversationList';
import ChatThread from './ChatThread';
import ContactDetails from './ContactDetails';

interface Props {
  etiquetas: Etiqueta[];
  vendedores?: Vendedor[];
  isAdmin?: boolean;
}

export default function ChatScreen({ etiquetas, vendedores = [], isAdmin = false }: Props) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const queryClient = useQueryClient();

  const handleUpdated = (updated: Lead) => {
    setSelectedLead(updated);
    queryClient.invalidateQueries({ queryKey: ['leads', 'conversas'] });
  };

  return (
    <div className="card flex overflow-hidden" style={{ height: 'calc(100vh - 276px)' }}>
      <ConversationList
        selectedLeadId={selectedLead?.id_number ?? null}
        onSelect={setSelectedLead}
        etiquetas={etiquetas}
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
        />
      )}
    </div>
  );
}
