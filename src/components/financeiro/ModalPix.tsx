'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, X, AlertCircle } from 'lucide-react';

const CHAVE_PIX_FALLBACK = '3a357463-a308-4964-bb7e-fda3481518b4';
// Nome/cidade do recebedor exigidos pelo padrão do "Pix Copia e Cola" (BR Code).
// Ajustar aqui se o nome/cidade cadastrados na chave forem diferentes.
const MERCHANT_NOME = 'DRIPFY';
const MERCHANT_CIDADE = 'SAO PAULO';

function tlv(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, '0')}${value}`;
}

function crc16ccitt(payload: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Monta o payload "Pix Copia e Cola" (BR Code / EMV) pra uma chave estática,
// sem valor fixo — o pagador digita o valor no próprio app do banco.
function montarPayloadPix(chave: string, nome: string, cidade: string): string {
  const merchantAccountInfo = tlv('00', 'br.gov.bcb.pix') + tlv('01', chave);
  let payload =
    tlv('00', '01') +
    tlv('26', merchantAccountInfo) +
    tlv('52', '0000') +
    tlv('53', '986') +
    tlv('58', 'BR') +
    tlv('59', nome.substring(0, 25)) +
    tlv('60', cidade.substring(0, 15)) +
    tlv('62', tlv('05', '***'));
  payload += '6304';
  return payload + crc16ccitt(payload);
}

interface Props {
  onClose: () => void;
}

export default function ModalPix({ onClose }: Props) {
  const [copiado, setCopiado] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const payloadPix = montarPayloadPix(CHAVE_PIX_FALLBACK, MERCHANT_NOME, MERCHANT_CIDADE);

  useEffect(() => {
    QRCode.toDataURL(payloadPix, { width: 220, margin: 1 })
      .then(setQrCodeUrl)
      .catch(() => setQrCodeUrl(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copiarChave = () => {
    navigator.clipboard.writeText(payloadPix);
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

        <div className="p-5 flex flex-col items-center gap-3">
          {qrCodeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrCodeUrl} alt="QR Code PIX" className="w-[220px] h-[220px] rounded-lg border border-gray-100" />
          ) : (
            <div className="w-[220px] h-[220px] rounded-lg border border-gray-100 flex items-center justify-center text-xs text-gray-400">
              Gerando QR Code...
            </div>
          )}

          <div className="w-full">
            <label className="text-xs text-gray-500 mb-1 block">Chave Pix (aleatória)</label>
            <code className="block text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 font-mono text-gray-700 break-all">
              {CHAVE_PIX_FALLBACK}
            </code>
          </div>

          <button
            onClick={copiarChave}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copiado ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
            {copiado ? 'Código copiado!' : 'Copiar Pix Copia e Cola'}
          </button>

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 w-full">
            <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Após realizar a transferência Pix para a chave acima, envie o comprovante para o suporte
              para liberação imediata dos seus créditos.
            </p>
          </div>

          <button onClick={onClose} className="btn-outline text-sm w-full">Fechar</button>
        </div>
      </div>
    </div>
  );
}
