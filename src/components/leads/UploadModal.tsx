'use client';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Upload, X, FileSpreadsheet, ClipboardPaste, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRow { nome: string; telefone: string; }

function parsePaste(text: string): ParsedRow[] {
  const clean = text.replace(/\r/g, '');
  const lines = clean.split('\n').filter((l) => l.trim());
  if (!lines.length) return [];
  const isTab = lines[0].includes('\t');
  const isSemi = lines[0].includes(';');
  const delim = isTab ? '\t' : isSemi ? ';' : '\t';
  const firstCols = lines[0].split(delim).map((c) => c.trim().toLowerCase());
  const hasHeader = firstCols.some((c) => c === 'nome' || c === 'name' || c === 'telefone');
  const dataLines = hasHeader ? lines.slice(1) : lines;
  return dataLines
    .map((line) => {
      const cols = line.split(delim).map((c) => c.trim());
      return { nome: cols[0] || '', telefone: cols[1] || '' };
    })
    .filter((r) => r.nome && r.telefone);
}

export default function UploadModal({ open, onClose, onSuccess }: Props) {
  const [tab, setTab] = useState<'arquivo' | 'colar'>('colar');
  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const preview = parsePaste(pasteText);

  const handleUpload = async () => {
    const params = campaignId ? `?campanha_id=${campaignId}` : '';
    setLoading(true);
    try {
      let res: any;
      if (tab === 'colar') {
        if (!pasteText.trim()) { toast.error('Cole os dados primeiro.'); setLoading(false); return; }
        res = await api.post(`/leads/bulk${params}`, { text: pasteText });
      } else {
        if (!file) { toast.error('Selecione um arquivo.'); setLoading(false); return; }
        const formData = new FormData();
        formData.append('file', file);
        res = await api.post(`/leads/upload${params}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast.success(`${res.data.inserted} leads importados! (${res.data.skipped} ignorados)`);
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao importar leads.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 text-lg">Importar Leads</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {/* Abas */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4">
          <button
            onClick={() => setTab('colar')}
            className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-1.5 rounded-md transition-colors ${tab === 'colar' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <ClipboardPaste size={14} /> Colar do Excel
          </button>
          <button
            onClick={() => setTab('arquivo')}
            className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-1.5 rounded-md transition-colors ${tab === 'arquivo' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <FileSpreadsheet size={14} /> Arquivo
          </button>
        </div>

        {tab === 'colar' ? (
          <div>
            <p className="text-xs text-gray-500 mb-2">
              Selecione as células no Excel (incluindo ou não o cabeçalho) e cole aqui. Ordem das colunas: <strong>Nome | Telefone</strong>
            </p>
            <textarea
              className="input w-full font-mono text-xs h-36 resize-none"
              placeholder={"Nome\tTelefone\nMarcelo\t5541998796149\nVanessa\t5541995740870"}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
            {preview.length > 0 && (
              <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center gap-1.5 text-green-700 text-xs font-medium mb-1.5">
                  <CheckCircle2 size={13} /> {preview.length} lead{preview.length !== 1 ? 's' : ''} detectado{preview.length !== 1 ? 's' : ''}
                </div>
                <div className="space-y-0.5 max-h-28 overflow-y-auto">
                  {preview.slice(0, 5).map((r, i) => (
                    <div key={i} className="flex gap-2 text-xs text-green-800 font-mono">
                      <span className="w-32 truncate">{r.nome}</span>
                      <span>{r.telefone}</span>
                    </div>
                  ))}
                  {preview.length > 5 && <p className="text-xs text-green-600">+ {preview.length - 5} mais...</p>}
                </div>
              </div>
            )}
            {pasteText.trim() && preview.length === 0 && (
              <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100 flex items-center gap-1.5 text-amber-700 text-xs">
                <AlertCircle size={13} /> Nenhum lead reconhecido. Verifique se o formato está correto.
              </div>
            )}
          </div>
        ) : (
          <div>
            <div
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${file ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file ? (
                <>
                  <FileSpreadsheet size={32} className="text-primary mx-auto mb-2" />
                  <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                  <p className="text-gray-400 text-xs mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                </>
              ) : (
                <>
                  <Upload size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm font-medium">Clique para selecionar</p>
                  <p className="text-gray-400 text-xs mt-1">.xlsx, .xls ou .csv</p>
                </>
              )}
            </div>
            <div className="mt-2 p-2.5 bg-blue-50 rounded-lg">
              <p className="text-blue-700 text-xs font-medium">Colunas esperadas:</p>
              <p className="text-blue-600 text-xs mt-0.5">Nome, Telefone (obrigatórias) · CPF (opcional)</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="btn-outline flex-1">Cancelar</button>
          <button
            onClick={handleUpload}
            disabled={loading || (tab === 'colar' ? preview.length === 0 : !file)}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? 'Importando...' : `Importar${tab === 'colar' && preview.length > 0 ? ` ${preview.length} leads` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
