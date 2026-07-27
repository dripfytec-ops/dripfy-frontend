'use client';
import { useState } from 'react';
import { AlertTriangle, CreditCard, Users } from 'lucide-react';
import { useAssinaturaStatus } from '@/lib/assinatura-api';
import ModalPixFixo from '@/components/financeiro/ModalPixFixo';

function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatarMoeda(valor: string | number): string {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AssinaturaPage() {
  const { data, isLoading } = useAssinaturaStatus();
  const [showPix, setShowPix] = useState(false);

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
            <button onClick={() => setShowPix(true)} className="btn-primary text-sm">Pagar com PIX</button>
          ) : (
            <p className="text-sm text-gray-400">PIX ainda não disponível — entre em contato com o suporte.</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center text-sm text-gray-500">
          Nenhuma fatura em aberto no momento. Você está em dia com a mensalidade.
        </div>
      )}

      {showPix && data.fatura_pendente?.pix_copia_cola && (
        <ModalPixFixo
          titulo="Pagamento da Mensalidade"
          descricao={`Fatura ${data.fatura_pendente.competencia} — após o pagamento, envie o comprovante pro suporte pra liberação imediata do acesso.`}
          valor={data.fatura_pendente.valor_total}
          copiaCola={data.fatura_pendente.pix_copia_cola}
          onClose={() => setShowPix(false)}
        />
      )}
    </div>
  );
}
