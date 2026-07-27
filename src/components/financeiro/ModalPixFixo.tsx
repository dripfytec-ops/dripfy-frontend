'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, X } from 'lucide-react';

function formatarMoeda(valor: string | number): string {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface Props {
  titulo: string;
  descricao: string;
  valor: string | number;
  copiaCola: string;
  onClose: () => void;
}

// Modal de PIX com valor fixo já embutido no QR Code — usado sempre que o
// valor da cobrança já é conhecido de antemão (mensalidade, usuário extra),
// diferente do ModalPix estático de créditos (onde o valor é escolhido pelo parceiro).
export default function ModalPixFixo({ titulo, descricao, valor, copiaCola, onClose }: Props) {
  const [copiado, setCopiado] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(copiaCola, { width: 220, margin: 1 }).then(setQrCodeUrl).catch(() => setQrCodeUrl(null));
  }, [copiaCola]);

  const copiar = () => {
    navigator.clipboard.writeText(copiaCola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{titulo}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-3">
          <p className="text-sm text-gray-500 text-center">{descricao}</p>
          <p className="text-2xl font-bold text-gray-900">{formatarMoeda(valor)}</p>

          {qrCodeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrCodeUrl} alt="QR Code PIX" className="w-[220px] h-[220px] rounded-lg border border-gray-100" />
          ) : (
            <div className="w-[220px] h-[220px] rounded-lg border border-gray-100 flex items-center justify-center text-xs text-gray-400">
              Gerando QR Code...
            </div>
          )}

          <button
            onClick={copiar}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copiado ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
            {copiado ? 'Código copiado!' : 'Copiar Pix Copia e Cola'}
          </button>

          <button onClick={onClose} className="btn-outline text-sm w-full">Fechar</button>
        </div>
      </div>
    </div>
  );
}
