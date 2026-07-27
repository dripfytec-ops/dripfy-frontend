'use client';
import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Wallet, Plus, ArrowUpCircle, ArrowDownCircle, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import { useSaldoEnriquecimento, useComprarCreditosEnriquecimento } from '@/lib/enriquecimento-api';
import { EnriquecimentoTransacaoTipo } from '@/types';
import ModalPixFixo from '@/components/financeiro/ModalPixFixo';

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function formatarMoeda(valor: string | number): string {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const TIPO_CONFIG: Record<EnriquecimentoTransacaoTipo, { label: string; icon: React.ElementType; className: string }> = {
  compra: { label: 'Compra', icon: ArrowUpCircle, className: 'text-green-600' },
  consumo: { label: 'Consumo', icon: ArrowDownCircle, className: 'text-red-600' },
  ajuste: { label: 'Ajuste', icon: SlidersHorizontal, className: 'text-blue-600' },
};

const QUANTIDADE_MINIMA_CREDITOS = 2000;

function ModalComprarCreditos({ precoUnitario, onClose }: { precoUnitario: string; onClose: () => void }) {
  const [quantidade, setQuantidade] = useState(String(QUANTIDADE_MINIMA_CREDITOS));
  const comprar = useComprarCreditosEnriquecimento();
  const [compra, setCompra] = useState<{ valor_total: string; pix_copia_cola: string } | null>(null);

  if (compra) {
    return (
      <ModalPixFixo
        titulo="Comprar Créditos de Higienização"
        descricao="Após o pagamento, envie o comprovante pro suporte pra liberação imediata dos créditos."
        valor={compra.valor_total}
        copiaCola={compra.pix_copia_cola}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-5">
        <h3 className="font-bold text-gray-900 mb-3">Comprar Créditos de Higienização</h3>
        <p className="text-xs text-gray-500 mb-3">{formatarMoeda(precoUnitario)} por crédito (1 crédito = 1 lead)</p>
        <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade de créditos</label>
        <input
          type="number"
          min={QUANTIDADE_MINIMA_CREDITOS}
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          className="input mb-3"
        />
        <p className="text-xs text-gray-400 -mt-2 mb-3">Mínimo de {QUANTIDADE_MINIMA_CREDITOS} créditos por compra.</p>
        <p className="text-sm text-gray-700 mb-4">
          Total: <span className="font-bold">{formatarMoeda(Number(quantidade || 0) * Number(precoUnitario))}</span>
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-outline flex-1 text-sm">Cancelar</button>
          <button
            onClick={() => {
              const qtd = Number(quantidade);
              if (!qtd || qtd < QUANTIDADE_MINIMA_CREDITOS) return toast.error(`Quantidade mínima é ${QUANTIDADE_MINIMA_CREDITOS} créditos.`);
              comprar.mutate(qtd, {
                onSuccess: (data) => setCompra({ valor_total: data.valor_total, pix_copia_cola: data.pix_copia_cola! }),
                onError: () => toast.error('Erro ao gerar cobrança.'),
              });
            }}
            disabled={comprar.isPending}
            className="btn-primary flex-1 text-sm"
          >
            {comprar.isPending ? 'Gerando...' : 'Gerar PIX'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreditosEnriquecimentoPage() {
  const { data, isLoading } = useSaldoEnriquecimento();
  const [showComprar, setShowComprar] = useState(false);

  return (
    <div className="p-6">
      {showComprar && data && <ModalComprarCreditos precoUnitario={data.valor_credito} onClose={() => setShowComprar(false)} />}

      <Link href="/dashboard/enriquecimento" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Enriquecimento
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-5">
        <div className="px-5 py-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
              <Wallet size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Saldo de Higienização</p>
              <p className="text-2xl font-bold text-gray-800">
                {isLoading ? '—' : `${data?.creditos_saldo ?? 0} créditos`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowComprar(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Créditos
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm">Extrato</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Data</th>
                <th className="text-left px-5 py-3 font-medium">Tipo</th>
                <th className="text-left px-5 py-3 font-medium">Descrição</th>
                <th className="text-right px-5 py-3 font-medium">Quantidade</th>
                <th className="text-right px-5 py-3 font-medium">Saldo após</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">Carregando…</td></tr>
              )}
              {!isLoading && (data?.transacoes.length ?? 0) === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">Nenhuma movimentação ainda.</td></tr>
              )}
              {!isLoading && data?.transacoes.map((t) => {
                const cfg = TIPO_CONFIG[t.tipo];
                const Icon = cfg.icon;
                return (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatarDataHora(t.criado_em)}</td>
                    <td className="px-5 py-3">
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${cfg.className}`}>
                        <Icon size={14} /> {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{t.descricao}</td>
                    <td className={`px-5 py-3 text-right font-mono font-medium ${t.quantidade >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {t.quantidade >= 0 ? '+' : ''}{t.quantidade}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700">{t.saldo_apos}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
