'use client';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, Copy, Check, Loader2 } from 'lucide-react';
import { comprarCreditos, useInvoiceStatus } from '@/lib/financeiro-api';
import { Invoice } from '@/types';

interface Props {
  quantidadeCreditos: number;
  valorTotal: number;
  onClose: () => void;
  onPago: (invoice: Invoice) => void;
}

export default function ComprarCreditosModal({ quantidadeCreditos, valorTotal, onClose, onPago }: Props) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelado = false;
    comprarCreditos({ quantidade_creditos: quantidadeCreditos, valor_total: valorTotal })
      .then((inv) => { if (!cancelado) setInvoice(inv); })
      .catch((e) => { if (!cancelado) setErro(e.response?.data?.message || 'Erro ao gerar cobrança PIX.'); })
      .finally(() => { if (!cancelado) setLoading(false); });
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling: assim que o webhook de pagamento processar a confirmação, o
  // status da invoice muda pra 'pago' e fechamos o modal automaticamente.
  const { data: statusAtualizado } = useInvoiceStatus(invoice?.id ?? null, { enabled: !!invoice && invoice.status === 'pendente' });

  useEffect(() => {
    if (statusAtualizado?.status === 'pago') {
      queryClient.invalidateQueries({ queryKey: ['financeiro', 'saldo'] });
      toast.success('Pagamento confirmado! Créditos adicionados.');
      onPago(statusAtualizado);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusAtualizado?.status]);

  const copiarCodigo = () => {
    if (!invoice?.pix_copia_cola) return;
    navigator.clipboard.writeText(invoice.pix_copia_cola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Comprar créditos via PIX</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center text-center gap-3">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{quantidadeCreditos} créditos</span> por{' '}
            <span className="font-semibold text-gray-900">
              {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </p>

          {loading && (
            <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-sm">Gerando QR Code PIX...</p>
            </div>
          )}

          {erro && (
            <div className="py-6">
              <p className="text-sm text-red-500">{erro}</p>
            </div>
          )}

          {invoice?.pix_qrcode_base64 && !loading && !erro && (
            <>
              <img
                src={`data:image/png;base64,${invoice.pix_qrcode_base64}`}
                alt="QR Code PIX"
                className="w-52 h-52 rounded-lg border border-gray-100"
              />
              <button
                onClick={copiarCodigo}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {copiado ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
                {copiado ? 'Código copiado!' : 'Copiar código'}
              </button>
              <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                <Loader2 size={12} className="animate-spin" />
                Aguardando confirmação do pagamento...
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
