'use client';
import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Etiqueta, Lead } from '@/types';
import ConversationList from './ConversationList';
import ChatThread from './ChatThread';
import ContactDetails from './ContactDetails';

interface Props {
  etiquetas: Etiqueta[];
}

export default function ChatScreen({ etiquetas }: Props) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

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
      {selectedLead && <ContactDetails lead={selectedLead} />}
    </div>
  );
}
