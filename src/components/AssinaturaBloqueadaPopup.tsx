'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AlertTriangle, X } from 'lucide-react';
import { ASSINATURA_BLOQUEADA_EVENT } from '@/lib/api';

export default function AssinaturaBloqueadaPopup() {
  const [aberto, setAberto] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setAberto(true);
    window.addEventListener(ASSINATURA_BLOQUEADA_EVENT, handler);
    return () => window.removeEventListener(ASSINATURA_BLOQUEADA_EVENT, handler);
  }, []);

  // Já está na tela de pagamento — não precisa do popup por cima.
  if (!aberto || pathname === '/dashboard/assinatura') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="p-5 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle size={22} className="text-red-500" />
          </div>
          <h3 className="font-bold text-gray-900">Assinatura em atraso</h3>
          <p className="text-sm text-gray-500">
            Sua mensalidade está em atraso e as funcionalidades do sistema foram bloqueadas.
            Regularize o pagamento para continuar usando o Dripfy normalmente.
          </p>
          <div className="flex gap-2 w-full mt-1">
            <button onClick={() => setAberto(false)} className="btn-outline flex-1 text-sm">Fechar</button>
            <button
              onClick={() => { setAberto(false); router.push('/dashboard/assinatura'); }}
              className="btn-primary flex-1 text-sm"
            >
              Ir para pagamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
