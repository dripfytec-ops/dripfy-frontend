'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { UploadCloud, FileSpreadsheet, Download, CheckCircle2, Clock, Wallet } from 'lucide-react';
import { useEnriquecimentos, useUploadEnriquecimento } from '@/lib/enriquecimento-api';

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function EnriquecimentoPage() {
  const { data: solicitacoes = [], isLoading } = useEnriquecimentos();
  const upload = useUploadEnriquecimento();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [quantidadeLeads, setQuantidadeLeads] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = () => {
    if (!arquivo) return toast.error('Selecione uma planilha primeiro.');
    const qtd = Number(quantidadeLeads);
    if (!qtd || qtd <= 0) return toast.error('Informe a quantidade de leads da planilha.');
    upload.mutate({ file: arquivo, quantidadeLeads: qtd, observacoes: observacoes.trim() || undefined }, {
      onSuccess: () => {
        toast.success('Planilha enviada! Aguarde o processamento.');
        setArquivo(null);
        setQuantidadeLeads('');
        setObservacoes('');
        if (inputRef.current) inputRef.current.value = '';
      },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Erro ao enviar planilha.'),
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enriquecimento de Leads</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Suba uma planilha com os telefones dos seus leads pra higienização. Nossa equipe trata manualmente
            e devolve a planilha com os telefones corrigidos.
          </p>
        </div>
        <Link
          href="/dashboard/enriquecimento/creditos"
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-medium rounded-lg transition-colors flex-shrink-0"
        >
          <Wallet className="w-3 h-3" /> Créditos
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 text-sm mb-3">Nova solicitação</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Planilha (.xlsx, .xls ou .csv)</label>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setArquivo(e.target.files?.[0] || null)}
              className="input text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade de leads na planilha</label>
            <input
              type="number"
              min={1}
              value={quantidadeLeads}
              onChange={(e) => setQuantidadeLeads(e.target.value)}
              className="input text-sm py-2"
              placeholder="Ex: 250"
            />
            <p className="text-xs text-gray-400 mt-1">
              1 crédito por lead — debitado do seu saldo assim que enviar.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Observações (opcional)</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="input text-sm"
              rows={2}
              placeholder="Alguma informação relevante sobre esses leads..."
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={!arquivo || upload.isPending}
            className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <UploadCloud size={15} />
            {upload.isPending ? 'Enviando...' : 'Enviar Planilha'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm">Minhas Solicitações</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : solicitacoes.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">Nenhuma solicitação enviada ainda.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {solicitacoes.map((s) => (
              <div key={s.id} className="px-5 py-3.5 flex items-center gap-3">
                <FileSpreadsheet size={18} className="text-green-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{s.nome_arquivo_original}</p>
                  <p className="text-xs text-gray-400">Enviado em {formatarDataHora(s.criado_em)} · {s.quantidade_leads} leads</p>
                </div>
                {s.status === 'pendente' ? (
                  <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 flex-shrink-0">
                    <Clock size={11} /> Em processamento
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 flex-shrink-0">
                    <CheckCircle2 size={11} /> Concluído
                  </span>
                )}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a href={s.arquivo_original_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-primary flex items-center gap-1">
                    <Download size={12} /> Original
                  </a>
                  {s.arquivo_processado_url && (
                    <a href={s.arquivo_processado_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                      <Download size={12} /> Higienizada
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
