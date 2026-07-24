'use client';
import { useState } from 'react';
import { Copy, Check, X, AlertCircle } from 'lucide-react';

const CHAVE_PIX_FALLBACK = '3a357463-a308-4964-bb7e-fda3481518b4';

interface Props {
  onClose: () => void;
}

export default function ModalPix({ onClose }: Props) {
  const [copiado, setCopiado] = useState(false);

  const copiarChave = () => {
    navigator.clipboard.writeText(CHAVE_PIX_FALLBACK);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Pagamento via PIX</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Chave Pix (aleatória)</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 font-mono text-gray-700 break-all">
                {CHAVE_PIX_FALLBACK}
              </code>
            </div>
          </div>

          <button
            onClick={copiarChave}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copiado ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
            {copiado ? 'Chave copiada!' : 'Copiar Chave Pix'}
          </button>

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
            <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Após realizar a transferência Pix para a chave acima, envie o comprovante para o suporte
              para liberação imediata dos seus créditos.
            </p>
          </div>

          <button onClick={onClose} className="btn-outline text-sm">Fechar</button>
        </div>
      </div>
    </div>
  );
}
