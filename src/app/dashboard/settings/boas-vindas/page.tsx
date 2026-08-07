'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MessageSquareText } from 'lucide-react';
import { useCanaisDM, updateCanalDM } from '@/lib/dm-api';

export default function BoasVindasPage() {
  const queryClient = useQueryClient();
  const { data: canais = [], isLoading } = useCanaisDM();

  const [canalId, setCanalId] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [ativa, setAtiva] = useState(false);
  const [saving, setSaving] = useState(false);

  const canal = canais.find((c) => c.id === canalId);

  useEffect(() => {
    if (canais.length && !canalId) setCanalId(canais[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canais]);

  useEffect(() => {
    if (!canal) return;
    setMensagem(canal.mensagem_boas_vindas || '');
    setAtiva(canal.saudacao_ativa);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canal?.id]);

  async function handleSave() {
    if (!canalId) return;
    setSaving(true);
    try {
      await updateCanalDM(canalId, { saudacao_ativa: ativa, mensagem_boas_vindas: mensagem.trim() || undefined });
      await queryClient.invalidateQueries({ queryKey: ['dm-canais'] });
      toast.success('Configuração de boas-vindas salva!');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mensagem de Boas Vindas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Envia automaticamente uma mensagem de texto quando um lead novo manda a primeira mensagem, e quando um
          lead disparado numa campanha responde pela primeira vez.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400 text-center py-3">Carregando…</p>
      ) : canais.length === 0 ? (
        <div className="card p-8 text-center border-dashed">
          <MessageSquareText size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 text-sm font-medium">Nenhum canal cadastrado</p>
          <p className="text-xs text-gray-400 mt-1">
            Cadastre um canal do WhatsApp em{' '}
            <Link href="/dashboard/settings" className="text-primary hover:underline">
              Configurações
            </Link>{' '}
            antes de configurar a saudação.
          </p>
        </div>
      ) : (
        <div className="card p-6 space-y-4">
          {canais.length > 1 && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Canal</label>
              <select
                value={canalId}
                onChange={(e) => setCanalId(e.target.value)}
                className="input"
              >
                {canais.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 py-1">
            <div>
              <p className="text-sm font-medium text-gray-900">Enviar saudação automática</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Só é enviada se estiver ligado e houver uma mensagem escrita abaixo.
              </p>
            </div>
            <button
              onClick={() => setAtiva((v) => !v)}
              className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${ativa ? 'bg-primary' : 'bg-gray-300'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${ativa ? 'translate-x-5' : ''}`}
              />
            </button>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Mensagem de saudação</label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={4}
              placeholder="Ex: Olá {{nome}}, tudo bem? Obrigado por entrar em contato! Em breve alguém da nossa equipe vai te responder."
              className="input resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Use <code className="bg-gray-100 px-1 rounded">{'{{nome}}'}</code> pra personalizar com o nome do lead.
              É enviada como mensagem de texto comum, sem precisar de aprovação de template da Meta.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="py-2 px-5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium disabled:opacity-60"
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
