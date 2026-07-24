'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, X, Sparkles } from 'lucide-react';
import { useCampanhasDripifyDM, useCampanhaDM } from '@/lib/dm-api';
import { StatusCampanhaDM } from '@/types';

function formatarDataHora(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

const statusConfig: Record<StatusCampanhaDM, { label: string; className: string }> = {
  rascunho: { label: 'Rascunho', className: 'bg-gray-100 text-gray-600' },
  agendada: { label: 'Agendada', className: 'bg-blue-100 text-blue-700' },
  em_andamento: { label: 'Em Andamento', className: 'bg-yellow-100 text-yellow-700' },
  concluida: { label: 'Concluída', className: 'bg-green-100 text-green-700' },
  pausada: { label: 'Pausada', className: 'bg-red-100 text-red-700' },
  aguardando_recarga: { label: 'Aguardando Recarga', className: 'bg-orange-100 text-orange-700' },
  aguardando_pagamento: { label: 'Aguardando Pagamento', className: 'bg-orange-100 text-orange-700' },
};

const PRIORIDADE_LABEL: Record<string, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };
const PRIORIDADE_CLASS: Record<string, string> = {
  baixa: 'bg-gray-100 text-gray-600',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-red-100 text-red-700',
};

function DemandaDetalheModal({ campanhaId, onClose }: { campanhaId: string; onClose: () => void }) {
  const { data: campanha } = useCampanhaDM(campanhaId);
  if (!campanha) return null;

  const cfg = statusConfig[campanha.status] ?? statusConfig.rascunho;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">{campanha.nome}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cfg.className}`}>{cfg.label}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                campanha.financeiro_status === 'pago' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {campanha.financeiro_status === 'pago' ? 'Pago' : 'Pagamento pendente'}
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${PRIORIDADE_CLASS[campanha.prioridade]}`}>
                {PRIORIDADE_LABEL[campanha.prioridade]}
              </span>
              <span className="text-xs text-gray-400">Canal: {campanha.canal?.nome || 'Canal Padrão Dripfy'}</span>
              <span className="text-xs text-gray-400">Agendada: {formatarDataHora(campanha.agendado_para)}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-6 py-4">
          {campanha.mensagem_texto && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1.5">Mensagem</p>
              <div className="rounded-lg p-3" style={{ background: '#efeae2' }}>
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-3.5 py-2 shadow-sm ml-auto whitespace-pre-wrap text-sm text-slate-900" style={{ background: '#d9fdd3' }}>
                  {campanha.mensagem_texto}
                </div>
              </div>
            </div>
          )}

          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 text-xs text-gray-500 font-medium bg-gray-50">
              Contatos ({campanha.contatos.length})
            </div>
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {campanha.contatos.map((c) => (
                <div key={c.id} className="px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-800">{c.nome || '—'}</p>
                    <p className="text-xs text-gray-400">{c.telefone}</p>
                  </div>
                  <span className="text-xs text-gray-400">{c.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DisparoDripifyListaPage() {
  const { data: demandas = [], isLoading } = useCampanhasDripifyDM();
  const [detalheId, setDetalheId] = useState<string | null>(null);

  return (
    <div className="p-6">
      {detalheId != null && <DemandaDetalheModal campanhaId={detalheId} onClose={() => setDetalheId(null)} />}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles size={15} className="text-amber-500" />
            <h2 className="font-semibold text-gray-800 text-sm">Disparo Dripfy — Demandas</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{isLoading ? 'Carregando…' : `${demandas.length} demanda(s)`}</span>
            <Link
              href="/dashboard/campaigns/dripify/nova"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-3 h-3" /> Nova Demanda
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Demanda</th>
                <th className="text-left px-5 py-3 font-medium">Canal</th>
                <th className="text-left px-5 py-3 font-medium">Agendada</th>
                <th className="text-left px-5 py-3 font-medium">Prioridade</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Financeiro</th>
                <th className="text-right px-5 py-3 font-medium">Contatos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400 text-sm">Carregando…</td></tr>
              )}
              {!isLoading && demandas.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400 text-sm">Nenhuma demanda Dripfy criada ainda.</td></tr>
              )}
              {!isLoading && demandas.map((d) => {
                const cfg = statusConfig[d.status] ?? statusConfig.rascunho;
                return (
                  <tr key={d.id} onClick={() => setDetalheId(d.id)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{d.nome}</td>
                    <td className="px-5 py-3 text-gray-500">{d.canal?.nome || 'Canal Padrão Dripfy'}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatarDataHora(d.agendado_para)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${PRIORIDADE_CLASS[d.prioridade]}`}>
                        {PRIORIDADE_LABEL[d.prioridade]}
                      </span>
                    </td>
                    <td className="px-5 py-3"><span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cfg.className}`}>{cfg.label}</span></td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        d.financeiro_status === 'pago' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {d.financeiro_status === 'pago' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700">{d.total_contatos}</td>
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
