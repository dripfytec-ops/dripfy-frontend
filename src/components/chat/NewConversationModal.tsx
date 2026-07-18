'use client';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '@/lib/api';
import { useCanaisDM, fetchTemplatesDM } from '@/lib/dm-api';
import { Lead, TemplateDM } from '@/types';

interface Props {
  onClose: () => void;
  onCreated: (lead: Lead) => void;
}

export default function NewConversationModal({ onClose, onCreated }: Props) {
  const { data: canais = [] } = useCanaisDM();
  const canaisAtivos = canais.filter((c) => c.ativo !== false);

  const [canalId, setCanalId] = useState('');
  const [templates, setTemplates] = useState<TemplateDM[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [param1, setParam1] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (canaisAtivos.length && !canalId) setCanalId(canaisAtivos[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canais]);

  useEffect(() => {
    if (!canalId) return;
    setLoadingTemplates(true);
    setTemplateName('');
    fetchTemplatesDM(canalId)
      .then((data) => setTemplates(data.filter((t) => t.status === 'APPROVED')))
      .catch(() => setTemplates([]))
      .finally(() => setLoadingTemplates(false));
  }, [canalId]);

  const templateAtual = templates.find((t) => t.name === templateName);
  const bodyTemplate = templateAtual?.components?.find((c) => c.type === 'BODY')?.text || '';
  const precisaParam1 = bodyTemplate.includes('{{1}}');

  useEffect(() => {
    if (precisaParam1 && !param1) setParam1(nome);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateName]);

  const handleSubmit = async () => {
    setErro('');
    if (!nome.trim() || !telefone.trim() || !canalId || !templateName) {
      setErro('Preencha nome, telefone, canal e template.');
      return;
    }
    setEnviando(true);
    try {
      const { data } = await api.post('/leads/start-conversation', {
        nome: nome.trim(),
        telefone: telefone.trim(),
        cpf: cpf.trim() || undefined,
        canal_id: canalId,
        template_name: templateName,
        template_params: precisaParam1 ? [param1 || nome] : [],
      });
      onCreated(data);
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Erro ao iniciar conversa.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">Nova Conversa</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {canaisAtivos.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum canal ativo. Configure um canal em Campanhas antes de iniciar uma conversa.</p>
          ) : (
            <>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nome</label>
                <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do contato"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Telefone</label>
                <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Com DDI, ex: 5541999999999"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">CPF (opcional)</label>
                <input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="Não informado"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
              </div>

              {canaisAtivos.length > 1 && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Canal</label>
                  <select value={canalId} onChange={(e) => setCanalId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-300">
                    {canaisAtivos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Template</label>
                {loadingTemplates ? (
                  <p className="text-sm text-gray-400">Carregando templates…</p>
                ) : (
                  <select value={templateName} onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-300">
                    <option value="">Selecione um template</option>
                    {templates.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                )}
                {bodyTemplate && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-gray-600 whitespace-pre-wrap">{bodyTemplate}</div>
                )}
              </div>

              {precisaParam1 && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Valor de {'{{1}}'}</label>
                  <input value={param1} onChange={(e) => setParam1(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              )}

              {erro && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>}

              <button onClick={handleSubmit} disabled={enviando}
                className="w-full py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium disabled:opacity-60">
                {enviando ? 'Enviando…' : 'Iniciar Conversa'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
