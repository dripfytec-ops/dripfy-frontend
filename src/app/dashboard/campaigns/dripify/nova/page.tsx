'use client';
import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  ChevronLeft, ChevronRight, Check, Upload, Image as ImageIcon, Video, Ban,
  AlertTriangle, User as UserIcon, Sparkles,
} from 'lucide-react';
import { useCanaisDM, useModelosDM, createDripifyDM, uploadMidiaDM } from '@/lib/dm-api';
import { useSaldoCreditos } from '@/lib/financeiro-api';
import ModalPix from '@/components/financeiro/ModalPix';
import { MidiaTipoDM, PrioridadeDM } from '@/types';

interface ContatoCSV {
  nome: string;
  telefone: string;
  cpf?: string;
}

const PASSOS = ['Identificação', 'Mensagem', 'Mídia', 'Contatos', 'Agendamento', 'Revisão'];

const PRIORIDADE_LABEL: Record<PrioridadeDM, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };
const PRIORIDADE_CLASS: Record<PrioridadeDM, string> = {
  baixa: 'bg-gray-100 text-gray-600',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-red-100 text-red-700',
};

function renderMarkdownWhats(texto: string) {
  // Aproximação simples do markdown que o WhatsApp renderiza: *negrito*, _itálico_, ~tachado~.
  const escaped = texto
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped
    .replace(/\*(.+?)\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/~(.+?)~/g, '<del>$1</del>')
    .replace(/\n/g, '<br/>');
}

// Toda demanda Dripfy segue o mesmo roteiro padrão de abordagem — o campo do
// wizard só captura a "novidade" (parte variável); saudação, chamada pra
// ação e rodapé de opt-out são sempre os mesmos.
function montarMensagemFinal(novidade: string): string {
  if (!novidade.trim()) return '';
  return `Oi, {{Nome}}!\n\nTemos uma novidade: ${novidade.trim()}.\n\nDeseja realizar sua simulação agora?\n\nPara *simular, use o botão abaixo 👇*\nDigite "sair" para não receber mais`;
}

const TITULO_BOTAO_PADRAO = 'CLIQUE AQUI';

function normalizarContatos(rows: Record<string, string>[]): ContatoCSV[] {
  return rows.map((row) => {
    const entry: ContatoCSV = { nome: '', telefone: '' };
    for (const key of Object.keys(row)) {
      const k = key.trim().toLowerCase();
      const v = row[key]?.toString().trim() || '';
      if (!v) continue;
      if (['nome', 'nome completo'].includes(k)) entry.nome = v;
      else if (['telefone', 'fone', 'celular', 'whatsapp'].includes(k)) entry.telefone = v.replace(/\D/g, '');
      else if (k === 'cpf') entry.cpf = v.replace(/\D/g, '');
    }
    return entry;
  }).filter((c) => c.telefone);
}

function parseColagem(texto: string): ContatoCSV[] {
  const linhas = texto.replace(/\r/g, '').split('\n').filter((l) => l.trim());
  return linhas.map((linha) => {
    const delim = linha.includes('\t') ? '\t' : linha.includes(';') ? ';' : ',';
    const cols = linha.split(delim).map((c) => c.trim());
    return { nome: cols[0] || '', telefone: (cols[1] || '').replace(/\D/g, ''), cpf: cols[2]?.replace(/\D/g, '') || undefined };
  }).filter((c) => c.telefone);
}

export default function DisparoDripifyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: canais = [] } = useCanaisDM();
  const { data: modelos = [] } = useModelosDM();
  const { data: saldoData } = useSaldoCreditos();
  const saldo = saldoData?.creditos_saldo ?? 0;

  const [passo, setPasso] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [showPix, setShowPix] = useState(false);
  const [concluido, setConcluido] = useState(false);

  // Passo 1
  const [nomeDemanda, setNomeDemanda] = useState('');
  const [canalId, setCanalId] = useState('');
  const [fotoPerfilFile, setFotoPerfilFile] = useState<File | null>(null);
  const [fotoPerfilPreview, setFotoPerfilPreview] = useState<string | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  // Passo 2
  const [origemMensagem, setOrigemMensagem] = useState<'zero' | 'modelo'>('zero');
  const [modeloId, setModeloId] = useState('');
  const [mensagemTexto, setMensagemTexto] = useState('');
  const [linkBotao, setLinkBotao] = useState('');
  const [salvarModelo, setSalvarModelo] = useState(false);
  const [nomeModelo, setNomeModelo] = useState('');

  // Passo 3
  const [midiaTipo, setMidiaTipo] = useState<MidiaTipoDM>('nenhuma');
  const [midiaFile, setMidiaFile] = useState<File | null>(null);
  const [midiaPreview, setMidiaPreview] = useState<string | null>(null);

  // Passo 4
  const [contatos, setContatos] = useState<ContatoCSV[]>([]);
  const [modoContatos, setModoContatos] = useState<'arquivo' | 'colar'>('arquivo');
  const [textoColado, setTextoColado] = useState('');

  // Passo 5
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [horaAgendamento, setHoraAgendamento] = useState('');
  const [prioridade, setPrioridade] = useState<PrioridadeDM>('media');

  const totalContatos = contatos.length;
  const saldoSuficiente = saldo >= totalContatos;
  const mensagemFinal = useMemo(() => montarMensagemFinal(mensagemTexto), [mensagemTexto]);

  const agendadoParaISO = useMemo(() => {
    if (!dataAgendamento || !horaAgendamento) return null;
    return new Date(`${dataAgendamento}T${horaAgendamento}:00`).toISOString();
  }, [dataAgendamento, horaAgendamento]);

  const agendamentoValido = useMemo(() => {
    if (!dataAgendamento || !horaAgendamento) return true; // opcional
    const alvo = new Date(`${dataAgendamento}T${horaAgendamento}:00`);
    const minimo = new Date(Date.now() + 90 * 60_000);
    return alvo.getTime() >= minimo.getTime();
  }, [dataAgendamento, horaAgendamento]);

  function handleFotoPerfil(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoPerfilFile(file);
    setFotoPerfilPreview(URL.createObjectURL(file));
  }

  function handleMidiaFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMidiaFile(file);
    setMidiaPreview(URL.createObjectURL(file));
  }

  function handleUploadContatos(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isCsv = file.name.toLowerCase().endsWith('.csv');
    if (isCsv) {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => setContatos(normalizarContatos(result.data)),
      });
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { raw: false });
        setContatos(normalizarContatos(rows));
      };
      reader.readAsBinaryString(file);
    }
  }

  function aplicarColagem() {
    setContatos(parseColagem(textoColado));
  }

  const podeAvancar = () => {
    if (passo === 1) return nomeDemanda.trim() !== '';
    if (passo === 2) return mensagemTexto.trim() !== '' && (!salvarModelo || nomeModelo.trim() !== '');
    if (passo === 4) return contatos.length > 0;
    if (passo === 5) return agendamentoValido;
    return true;
  };

  async function handleSubmit() {
    setErro('');
    // A demanda é criada mesmo sem saldo suficiente — o backend registra como
    // 'aguardando_pagamento' e ela só é liberada quando o Master confirmar o
    // pagamento no painel /admin/demandas-dripfy. O ModalPix é só uma ajuda
    // pra o cliente pagar, não trava o envio da demanda.
    setEnviando(true);
    try {
      let fotoPerfilUrl: string | undefined;
      if (fotoPerfilFile) fotoPerfilUrl = (await uploadMidiaDM(fotoPerfilFile)).url;

      let midiaUrl: string | undefined;
      if (midiaTipo !== 'nenhuma' && midiaFile) midiaUrl = (await uploadMidiaDM(midiaFile)).url;

      await createDripifyDM({
        nome: nomeDemanda,
        canal_id: canalId || null,
        foto_perfil_url: fotoPerfilUrl || null,
        mensagem_texto: mensagemFinal,
        mensagem_nucleo: mensagemTexto,
        link_botao: linkBotao || null,
        midia_tipo: midiaTipo,
        midia_url: midiaUrl || null,
        salvar_como_modelo: salvarModelo,
        nome_modelo: salvarModelo ? nomeModelo : undefined,
        agendado_para: agendadoParaISO,
        prioridade,
        contatos,
      });

      if (salvarModelo) queryClient.invalidateQueries({ queryKey: ['dm-modelos'] });
      queryClient.invalidateQueries({ queryKey: ['dm-dripify'] });
      setConcluido(true);
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Erro ao enviar demanda.');
    } finally {
      setEnviando(false);
    }
  }

  function resetWizard() {
    setPasso(1);
    setErro('');
    setConcluido(false);
    setNomeDemanda('');
    setCanalId('');
    setFotoPerfilFile(null);
    setFotoPerfilPreview(null);
    setOrigemMensagem('zero');
    setModeloId('');
    setMensagemTexto('');
    setLinkBotao('');
    setSalvarModelo(false);
    setNomeModelo('');
    setMidiaTipo('nenhuma');
    setMidiaFile(null);
    setMidiaPreview(null);
    setContatos([]);
    setModoContatos('arquivo');
    setTextoColado('');
    setDataAgendamento('');
    setHoraAgendamento('');
    setPrioridade('media');
  }

  if (concluido) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-800">Demanda enviada!</h3>
          <p className="text-sm text-gray-500">
            {saldoSuficiente
              ? 'Sua demanda foi registrada e está pronta pra execução. Os contatos já aparecem no Chat.'
              : 'Sua demanda foi registrada e ficará aguardando a confirmação do pagamento pra ser liberada.'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <button onClick={resetWizard} className="btn-primary text-sm">
              Criar outra demanda
            </button>
            <button onClick={() => router.push('/dashboard/campaigns/dripify')} className="btn-outline text-sm">
              Ver minhas demandas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {showPix && <ModalPix onClose={() => setShowPix(false)} />}

      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={18} className="text-amber-500" />
        <h2 className="text-lg font-semibold text-gray-800">Disparo Dripfy</h2>
      </div>
      <p className="text-sm text-gray-500 mb-5">Sua demanda é executada pela equipe Dripfy — sem precisar configurar seu próprio canal.</p>

      {/* Stepper */}
      <div className="flex items-center mb-6">
        {PASSOS.map((label, i) => {
          const n = i + 1;
          const ativo = n === passo;
          const feito = n < passo;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  feito ? 'bg-green-500 text-white' : ativo ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {feito ? <Check size={13} /> : n}
                </div>
                <span className={`text-[10px] whitespace-nowrap ${ativo ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>{label}</span>
              </div>
              {n < PASSOS.length && <div className={`flex-1 h-0.5 mx-1 ${feito ? 'bg-green-400' : 'bg-gray-100'}`} />}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[360px]">
        {passo === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nome da demanda</label>
              <input value={nomeDemanda} onChange={(e) => setNomeDemanda(e.target.value)} placeholder="Ex: Campanha Julho — Base CredPix" className="input" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Foto de perfil (opcional)</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fotoInputRef.current?.click()}
                  className="w-14 h-14 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-blue-300 hover:text-blue-400 transition-colors overflow-hidden shrink-0"
                >
                  {fotoPerfilPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fotoPerfilPreview} alt="Prévia" className="w-full h-full object-cover" />
                  ) : <UserIcon size={20} />}
                </button>
                <input ref={fotoInputRef} type="file" accept="image/*" onChange={handleFotoPerfil} className="hidden" />
                <p className="text-xs text-gray-400">Identidade usada na execução manual desta demanda.</p>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Número/canal de disparo</label>
              <select value={canalId} onChange={(e) => setCanalId(e.target.value)} className="input bg-white">
                <option value="">Canal Padrão Dripfy</option>
                {canais.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
        )}

        {passo === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Mensagem</label>
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => setOrigemMensagem('zero')}
                  className={`flex-1 py-1.5 rounded-lg text-xs border transition-colors ${origemMensagem === 'zero' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-200 text-gray-600'}`}>
                  Escrever do zero
                </button>
                <button type="button" onClick={() => setOrigemMensagem('modelo')}
                  disabled={modelos.length === 0}
                  className={`flex-1 py-1.5 rounded-lg text-xs border transition-colors disabled:opacity-40 ${origemMensagem === 'modelo' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-200 text-gray-600'}`}>
                  Usar modelo salvo {modelos.length === 0 && '(nenhum salvo)'}
                </button>
              </div>
              {origemMensagem === 'modelo' && (
                <select
                  value={modeloId}
                  onChange={(e) => {
                    setModeloId(e.target.value);
                    const m = modelos.find((x) => x.id === e.target.value);
                    if (m) { setMensagemTexto(m.texto); setLinkBotao(m.link_botao || ''); }
                  }}
                  className="input bg-white mb-2"
                >
                  <option value="">Selecione um modelo</option>
                  {modelos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              )}
              <textarea
                value={mensagemTexto}
                onChange={(e) => setMensagemTexto(e.target.value)}
                placeholder="Digite só a novidade — ex: Solicitação do seu Crédito CLT atualizada! (use *negrito*, _itálico_ e ~tachado~)"
                rows={3}
                className="input font-mono text-sm"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                A saudação, a chamada pra ação e o rodapé de opt-out são adicionados automaticamente — veja a prévia abaixo.
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Link do botão (opcional)</label>
              <input value={linkBotao} onChange={(e) => setLinkBotao(e.target.value)} placeholder="https://..." className="input" />
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input type="checkbox" checked={salvarModelo} onChange={(e) => setSalvarModelo(e.target.checked)} className="rounded" />
              Salvar como modelo pra reutilizar depois
            </label>
            {salvarModelo && (
              <input value={nomeModelo} onChange={(e) => setNomeModelo(e.target.value)} placeholder="Nome do modelo..." className="input" />
            )}

            {mensagemFinal && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Prévia (como o cliente vai ver)</p>
                <div className="rounded-lg p-3" style={{ background: '#efeae2' }}>
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-3.5 py-2 shadow-sm ml-auto" style={{ background: '#d9fdd3' }}>
                    <p className="text-sm text-slate-900 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderMarkdownWhats(mensagemFinal) }} />
                    {linkBotao && (
                      <div className="mt-2 pt-2 border-t border-black/10 text-center">
                        <span className="text-xs text-blue-600 font-bold">{TITULO_BOTAO_PADRAO}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {passo === 3 && (
          <div className="space-y-4">
            <label className="text-xs text-gray-500 mb-1 block">Mídia</label>
            <div className="flex gap-2">
              {([
                { v: 'nenhuma', label: 'Sem Mídia', icon: Ban },
                { v: 'imagem', label: 'Imagem', icon: ImageIcon },
                { v: 'video', label: 'Vídeo', icon: Video },
              ] as const).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => { setMidiaTipo(opt.v); if (opt.v === 'nenhuma') { setMidiaFile(null); setMidiaPreview(null); } }}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg text-xs border transition-colors ${
                    midiaTipo === opt.v ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  <opt.icon size={16} />
                  {opt.label}
                </button>
              ))}
            </div>
            {midiaTipo !== 'nenhuma' && (
              <div>
                <input type="file" accept={midiaTipo === 'imagem' ? 'image/*' : 'video/*'} onChange={handleMidiaFile}
                  className="w-full text-sm text-gray-500 file:mr-3 file:bg-blue-500 file:text-white file:border-0 file:rounded-lg file:px-3 file:py-1.5 file:text-xs file:cursor-pointer" />
                {midiaPreview && midiaTipo === 'imagem' && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={midiaPreview} alt="Prévia" className="mt-3 h-32 rounded-lg object-cover border border-gray-200" />
                )}
                {midiaPreview && midiaTipo === 'video' && (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video src={midiaPreview} controls className="mt-3 h-32 rounded-lg border border-gray-200" />
                )}
              </div>
            )}
          </div>
        )}

        {passo === 4 && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button type="button" onClick={() => setModoContatos('arquivo')}
                className={`flex-1 py-1.5 rounded-lg text-xs border transition-colors ${modoContatos === 'arquivo' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-200 text-gray-600'}`}>
                Upload de arquivo
              </button>
              <button type="button" onClick={() => setModoContatos('colar')}
                className={`flex-1 py-1.5 rounded-lg text-xs border transition-colors ${modoContatos === 'colar' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-200 text-gray-600'}`}>
                Colar lista
              </button>
            </div>

            {modoContatos === 'arquivo' ? (
              <div>
                <p className="text-[11px] text-gray-400 mb-1.5">
                  Colunas: <b>nome</b> e <b>telefone</b> (obrigatórias, com DDI, ex: 5541999999999). Opcional: <b>cpf</b>.
                </p>
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleUploadContatos}
                  className="w-full text-sm text-gray-500 file:mr-3 file:bg-blue-500 file:text-white file:border-0 file:rounded-lg file:px-3 file:py-1.5 file:text-xs file:cursor-pointer" />
              </div>
            ) : (
              <div>
                <textarea
                  value={textoColado}
                  onChange={(e) => setTextoColado(e.target.value)}
                  placeholder={'Cole aqui: nome, telefone, cpf (um contato por linha)\nJoão Silva, 5541999999999, 12345678900'}
                  rows={6}
                  className="input font-mono text-xs"
                />
                <button onClick={aplicarColagem} disabled={!textoColado.trim()} className="btn-primary-sm mt-2">
                  Processar lista
                </button>
              </div>
            )}

            {contatos.length > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{totalContatos} contato{totalContatos === 1 ? '' : 's'} carregado{totalContatos === 1 ? '' : 's'}</p>
                  <p className="text-xs text-gray-500">Custo estimado: <b>{totalContatos} crédito{totalContatos === 1 ? '' : 's'}</b> (1 crédito por contato)</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Seu saldo</p>
                  <p className={`text-sm font-bold ${saldoSuficiente ? 'text-green-600' : 'text-red-500'}`}>{saldo} créditos</p>
                </div>
              </div>
            )}
          </div>
        )}

        {passo === 5 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Data (opcional)</label>
                <input type="date" value={dataAgendamento} onChange={(e) => setDataAgendamento(e.target.value)} className="input" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Horário</label>
                <input type="time" value={horaAgendamento} onChange={(e) => setHoraAgendamento(e.target.value)} className="input" />
              </div>
            </div>
            {!agendamentoValido && (
              <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12} /> O agendamento precisa ser pelo menos 90 minutos no futuro.</p>
            )}
            {!dataAgendamento && <p className="text-xs text-gray-400">Deixe em branco pra assim que possível (assim que aprovada/liberada).</p>}

            <div>
              <label className="text-xs text-gray-500 mb-2 block">Prioridade</label>
              <div className="flex gap-2">
                {(Object.keys(PRIORIDADE_LABEL) as PrioridadeDM[]).map((p) => (
                  <button key={p} type="button" onClick={() => setPrioridade(p)}
                    className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${prioridade === p ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-200 text-gray-600'}`}>
                    {PRIORIDADE_LABEL[p]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {passo === 6 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Resumo da demanda</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Nome</span><span className="text-gray-800 font-medium">{nomeDemanda || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Canal</span><span className="text-gray-800">{canais.find((c) => c.id === canalId)?.nome || 'Canal Padrão Dripfy'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Mídia</span><span className="text-gray-800 capitalize">{midiaTipo}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Contatos</span><span className="text-gray-800 font-medium">{totalContatos}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Agendamento</span><span className="text-gray-800">{dataAgendamento ? `${dataAgendamento} às ${horaAgendamento}` : 'Assim que liberado'}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Prioridade</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${PRIORIDADE_CLASS[prioridade]}`}>{PRIORIDADE_LABEL[prioridade]}</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500 mb-1">Prévia da mensagem (como o cliente vai ver)</p>
              <div className="rounded-lg p-3" style={{ background: '#efeae2' }}>
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-3.5 py-2 shadow-sm ml-auto" style={{ background: '#d9fdd3' }}>
                  <p className="text-sm text-slate-900 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderMarkdownWhats(mensagemFinal) }} />
                  {linkBotao && (
                    <div className="mt-2 pt-2 border-t border-black/10 text-center">
                      <span className="text-xs text-blue-600 font-bold">{TITULO_BOTAO_PADRAO}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-sm text-gray-600">Custo total</span>
              <span className="text-lg font-bold text-gray-900">{totalContatos} créditos</span>
            </div>

            {!saldoSuficiente ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col gap-2">
                <p className="text-sm text-amber-800 font-medium flex items-center gap-1.5"><AlertTriangle size={14} /> Saldo insuficiente</p>
                <p className="text-xs text-amber-700">
                  Você tem {saldo} crédito{saldo === 1 ? '' : 's'} e precisa de {totalContatos}. A demanda será registrada e liberada assim que o pagamento for confirmado.
                </p>
                <button onClick={() => setShowPix(true)} className="btn-primary-sm self-start">Comprar Créditos via PIX</button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-xs text-green-700">
                Saldo suficiente — a demanda será liberada pra execução assim que enviada.
              </div>
            )}

            {erro && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setPasso((p) => Math.max(1, p - 1))}
          disabled={passo === 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={15} /> Voltar
        </button>

        {passo < PASSOS.length ? (
          <button
            onClick={() => podeAvancar() && setPasso((p) => p + 1)}
            disabled={!podeAvancar()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-sm font-medium transition-colors"
          >
            Próximo <ChevronRight size={15} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={enviando}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {enviando ? 'Enviando...' : 'Enviar Demanda'} <Upload size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
