'use client';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { FileSpreadsheet, Download, CheckCircle2, Clock, UploadCloud } from 'lucide-react';
import { useEnriquecimentosAdmin, useConcluirEnriquecimento } from '@/lib/enriquecimento-api';

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function AdminEnriquecimentoPage() {
  const { data: solicitacoes = [], isLoading } = useEnriquecimentosAdmin();
  const concluir = useConcluirEnriquecimento();
  const [enviandoId, setEnviandoId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleArquivoSelecionado = (id: string, file: File | undefined) => {
    if (!file) return;
    setEnviandoId(id);
    concluir.mutate({ id, file }, {
      onSuccess: () => { toast.success('Planilha higienizada enviada!'); setEnviandoId(null); },
      onError: (e: any) => { toast.error(e?.response?.data?.message || 'Erro ao enviar planilha.'); setEnviandoId(null); },
    });
  };

  const pendentes = solicitacoes.filter((s) => s.status === 'pendente');
  const concluidas = solicitacoes.filter((s) => s.status === 'concluido');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Enriquecimento de Leads</h1>
        <p className="text-gray-500 text-sm mt-0.5">Planilhas enviadas pelos lojistas pra higienização de telefones</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : solicitacoes.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">Nenhuma solicitação enviada ainda.</div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Clock size={14} className="text-amber-500" /> Pendentes ({pendentes.length})
            </h2>
            {pendentes.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhuma pendência no momento.</p>
            ) : (
              <div className="card divide-y divide-gray-50 overflow-hidden">
                {pendentes.map((s) => (
                  <div key={s.id} className="px-5 py-3.5 flex items-center gap-3">
                    <FileSpreadsheet size={18} className="text-green-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{s.tenant?.nome_empresa} — {s.nome_arquivo_original}</p>
                      <p className="text-xs text-gray-400">Enviado em {formatarDataHora(s.criado_em)}{s.observacoes ? ` · ${s.observacoes}` : ''}</p>
                    </div>
                    <a href={s.arquivo_original_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-primary flex items-center gap-1 flex-shrink-0">
                      <Download size={12} /> Baixar Original
                    </a>
                    <input
                      ref={(el) => { inputRefs.current[s.id] = el; }}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(e) => handleArquivoSelecionado(s.id, e.target.files?.[0])}
                    />
                    <button
                      onClick={() => inputRefs.current[s.id]?.click()}
                      disabled={enviandoId === s.id}
                      className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
                    >
                      <UploadCloud size={12} /> {enviandoId === s.id ? 'Enviando...' : 'Enviar Higienizada'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-green-600" /> Concluídas ({concluidas.length})
            </h2>
            {concluidas.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhuma concluída ainda.</p>
            ) : (
              <div className="card divide-y divide-gray-50 overflow-hidden">
                {concluidas.map((s) => (
                  <div key={s.id} className="px-5 py-3.5 flex items-center gap-3">
                    <FileSpreadsheet size={18} className="text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{s.tenant?.nome_empresa} — {s.nome_arquivo_original}</p>
                      <p className="text-xs text-gray-400">Concluído em {s.concluido_em ? formatarDataHora(s.concluido_em) : '—'} por {s.concluido_por}</p>
                    </div>
                    <a href={s.arquivo_original_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-primary flex items-center gap-1 flex-shrink-0">
                      <Download size={12} /> Original
                    </a>
                    {s.arquivo_processado_url && (
                      <a href={s.arquivo_processado_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:underline flex items-center gap-1 flex-shrink-0">
                        <Download size={12} /> Higienizada
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
