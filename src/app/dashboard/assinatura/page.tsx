'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, AlertTriangle, CreditCard, Users } from 'lucide-react';
import { useAssinaturaStatus } from '@/lib/assinatura-api';

function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatarMoeda(valor: string | number): string {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function PixFatura({ copiaCola }: { copiaCola: string }) {
  const [copiado, setCopiado] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(copiaCola, { width: 200, margin: 1 }).then(setQrCodeUrl).catch(() => setQrCodeUrl(null));
  }, [copiaCola]);

  const copiar = () => {
    navigator.clipboard.writeText(copiaCola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {qrCodeUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrCodeUrl} alt="QR Code PIX" className="w-[200px] h-[200px] rounded-lg border border-gray-100" />
      ) : (
        <div className="w-[200px] h-[200px] rounded-lg border border-gray-100 flex items-center justify-center text-xs text-gray-400">
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
      <p className="text-xs text-gray-500 text-center">
        Após o pagamento, envie o comprovante para o suporte pra liberação imediata do acesso.
      </p>
    </div>
  );
}

export default function AssinaturaPage() {
  const { data, isLoading } = useAssinaturaStatus();

  if (isLoading || !data) {
    return (
      <div className="p-6 flex justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {data.assinatura_bloqueada && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 text-sm font-medium px-4 py-3 rounded-xl">
          <AlertTriangle size={16} className="flex-shrink-0" /> Sua assinatura está em atraso. Pague a fatura abaixo para reativar as funcionalidades do sistema.
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={16} className="text-primary" />
          <h2 className="font-semibold text-gray-800 text-sm">Plano e Mensalidade</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="border border-gray-100 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Pacote Start</p>
            <p className="text-sm font-bold text-gray-900">{formatarMoeda(data.valor_mensalidade_base)}</p>
            <p className="text-xs text-gray-400">{data.usuarios_inclusos} usuários inclusos</p>
          </div>
          <div className="border border-gray-100 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Usuário adicional</p>
            <p className="text-sm font-bold text-gray-900">{formatarMoeda(data.valor_usuario_adicional)}</p>
            <p className="text-xs text-gray-400">por usuário/mês</p>
          </div>
          <div className="border border-gray-100 rounded-xl p-3">
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-1"><Users size={11} /> Usuários atuais</div>
            <p className="text-sm font-bold text-gray-900">{data.usuarios_atual}</p>
            <p className="text-xs text-gray-400">{data.usuarios_extras_atual > 0 ? `${data.usuarios_extras_atual} extra(s)` : 'dentro do plano'}</p>
          </div>
          <div className="border border-gray-100 rounded-xl p-3 bg-blue-50/50">
            <p className="text-xs text-gray-400 mb-1">Valor mensal atual</p>
            <p className="text-sm font-bold text-primary">{formatarMoeda(data.valor_mensal_atual)}</p>
            <p className="text-xs text-gray-400">Próxima cobrança: {formatarData(data.proxima_cobranca_em)}</p>
          </div>
        </div>
      </div>

      {data.fatura_pendente ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-1">Fatura em aberto — {data.fatura_pendente.competencia}</h2>
          <p className="text-xs text-gray-500 mb-4">
            Vencimento em {formatarData(data.fatura_pendente.vencimento)} — {formatarMoeda(data.fatura_pendente.valor_total)}
          </p>
          {data.fatura_pendente.pix_copia_cola ? (
            <PixFatura copiaCola={data.fatura_pendente.pix_copia_cola} />
          ) : (
            <p className="text-sm text-gray-400">PIX ainda não disponível — entre em contato com o suporte.</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center text-sm text-gray-500">
          Nenhuma fatura em aberto no momento. Você está em dia com a mensalidade.
        </div>
      )}
    </div>
  );
}
