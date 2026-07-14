'use client';
import { X } from 'lucide-react';
import { Lead } from '@/types';
import ChatThread from '@/components/chat/ChatThread';

interface Props {
  lead: Lead;
  onClose: () => void;
}

export default function LeadConversation({ lead, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white flex flex-col h-full shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
        >
          <X size={18} />
        </button>
        <ChatThread lead={lead} />
      </div>
    </div>
  );
}
