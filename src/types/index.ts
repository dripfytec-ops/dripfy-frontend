export type UserRole = 'admin_master' | 'lojista_admin' | 'atendente';
export type LeadStatus = 'balde_geral' | 'aguardando_resposta' | 'em_atendimento' | 'finalizado';
export type SubscriptionStatus = 'ativo' | 'inativo' | 'trial';
export type MessageStatus = 'enviado' | 'entregue' | 'lido' | 'erro';
export type MessageDirection = 'entrada' | 'saida';

export interface BmToken {
  id: string;
  tenant_id: string;
  nome: string;
  token: string;
  criado_em: string;
}

export interface QuickReply {
  id: string;
  tenant_id: string;
  titulo: string;
  texto: string;
  criado_por?: string | null;
  criado_em: string;
}

export interface Etiqueta {
  id: string;
  tenant_id: string;
  nome: string;
  cor_hexadecimal: string;
  ordem: number;
  slug?: string;
  criado_por?: string | null;
}

// ─── Disparo em Massa (canais oficiais Meta + campanhas em lote) ──────────

export type StatusCampanhaDM = 'rascunho' | 'agendada' | 'em_andamento' | 'concluida' | 'pausada' | 'aguardando_recarga' | 'aguardando_pagamento';
export type StatusContatoDM = 'pendente' | 'enviando' | 'enviado' | 'entregue' | 'lido' | 'falha';
export type TipoCampanhaDM = 'proprio' | 'dripfy';
export type PrioridadeDM = 'baixa' | 'media' | 'alta';
export type FinanceiroStatusDM = 'pendente' | 'pago';
export type MidiaTipoDM = 'nenhuma' | 'imagem' | 'video';

export interface CanalDM {
  id: string;
  nome: string;
  telefone: string | null;
  waba_id: string;
  phone_number_id: string;
  bm_nome: string | null;
  lote_size: number | null;
  delay_ms: number | null;
  template_boas_vindas: string | null;
  chatwoot_inbox_id: number | null;
  ativo: boolean;
  criado_em: string;
  token_preview: string;
}

export interface CampanhaDM {
  id: string;
  nome: string;
  canal_id: string | null;
  canal?: { id: string; nome: string } | null;
  vendedor_id?: string | null;
  vendedor?: { id: string; nome: string } | null;
  template_name: string | null;
  template_params: string[];
  header_image_url: string | null;
  status: StatusCampanhaDM;
  agendado_para: string | null;
  iniciado_em: string | null;
  total_contatos: number;
  enviados: number;
  entregues: number;
  falhas: number;
  criado_em: string;
  tipo: TipoCampanhaDM;
  prioridade: PrioridadeDM;
  financeiro_status: FinanceiroStatusDM | null;
  mensagem_texto: string | null;
  link_botao: string | null;
  foto_perfil_url: string | null;
  midia_tipo: MidiaTipoDM | null;
  midia_url: string | null;
  aprovado_em: string | null;
  aprovado_por: string | null;
  tenant?: { id: string; nome_empresa: string; slug: string };
}

export interface ModeloMensagemDM {
  id: string;
  nome: string;
  texto: string;
  link_botao: string | null;
  criado_em: string;
}

export interface ContatoCampanhaDM {
  id: string;
  campanha_id: string;
  nome: string | null;
  telefone: string;
  status: StatusContatoDM;
  enviado_em: string | null;
  erro: string | null;
  message_id: string | null;
  criado_em: string;
}

export interface CampanhaDetalhesDM extends CampanhaDM {
  contatos: ContatoCampanhaDM[];
}

export interface TemplateDM {
  id: string;
  name: string;
  status: string;
  category: string;
  language: string;
  components: { type: string; text?: string; format?: string }[];
}

export interface StatusCanalDM {
  canal_id: string;
  nome: string;
  quality_rating: 'GREEN' | 'YELLOW' | 'RED' | string | null;
  throughput_level: string | null;
  account_status: string | null;
  display_phone_number: string | null;
  moeda: string | null;
  volume_30d: number;
  custo_30d: number;
  custo_medio: number;
  custo_30d_brl: number | null;
  cotacao_usd_brl: number | null;
  erro: string | null;
}

export interface Message {
  id: string;
  lead_id: number;
  wamid?: string;
  template_name?: string;
  direction: MessageDirection;
  content?: string;
  media_url?: string | null;
  media_mime_type?: string | null;
  status: MessageStatus;
  erro_msg?: string;
  criado_em: string;
}

export interface Vendedor {
  id: string;
  nome: string;
}

export interface TeamMember {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
  criado_em: string;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  tenant_id: string;
  tenant: {
    id: string;
    nome_empresa: string;
    slug: string;
    status_assinatura: SubscriptionStatus;
  };
}

export interface Lead {
  id_number: number;
  id_uuid: string;
  tenant_id: string;
  cpf?: string;
  nome: string;
  telefone: string;
  status_atual: LeadStatus;
  etiquetas: Etiqueta[];
  vendedor_id?: string;
  vendedor?: Vendedor;
  disparado: boolean;
  iniciado_pelo_cliente: boolean;
  last_message_at?: string;
  last_message_preview?: string;
  unread_count: number;
  origem_campanha_id?: string | null;
  origem_campanha_nome?: string | null;
  criado_em: string;
}

export interface LeadActivity {
  id: string;
  lead_id: number;
  texto: string;
  criado_em: string;
}

export interface Tenant {
  id: string;
  nome_empresa: string;
  slug: string;
  cnpj?: string | null;
  telefone?: string | null;
  nome_responsavel?: string | null;
  email_contato?: string | null;
  status_assinatura: SubscriptionStatus;
  criado_em: string;
  usuarios_inclusos?: number;
  valor_mensalidade_base?: string;
  valor_usuario_adicional?: string;
  assinatura_bloqueada?: boolean;
  proxima_cobranca_em?: string | null;
  _count?: { users: number; leads: number; dm_campanhas?: number };
}

export type MensalidadeFaturaStatus = 'pendente' | 'pago' | 'cancelado';

export interface MensalidadeFatura {
  id: string;
  tenant_id: string;
  competencia: string;
  usuarios_cobrados: number;
  usuarios_extras: number;
  valor_total: string;
  status: MensalidadeFaturaStatus;
  vencimento: string;
  pago_em: string | null;
  pix_copia_cola: string | null;
  criado_em: string;
}

export type CobrancaAvulsaStatus = 'pendente' | 'pago' | 'cancelado';

export interface CobrancaAvulsaUsuario {
  id: string;
  tenant_id: string;
  user_id: string;
  valor: string;
  status: CobrancaAvulsaStatus;
  pix_copia_cola: string | null;
  criado_em: string;
  pago_em: string | null;
  user?: { nome: string; email: string };
}

export interface MensalidadeResumo {
  usuarios_inclusos: number;
  valor_mensalidade_base: string;
  valor_usuario_adicional: string;
  usuarios_atual: number;
  usuarios_extras_atual: number;
  valor_mensal_atual: number;
  assinatura_bloqueada: boolean;
  proxima_cobranca_em: string | null;
  fatura_pendente?: MensalidadeFatura | null;
  faturas?: MensalidadeFatura[];
  cobrancas_avulsas?: CobrancaAvulsaUsuario[];
}

export type EnriquecimentoStatus = 'pendente' | 'concluido';

export interface EnriquecimentoSolicitacao {
  id: string;
  tenant_id: string;
  nome_arquivo_original: string;
  arquivo_original_url: string;
  quantidade_leads: number;
  observacoes: string | null;
  status: EnriquecimentoStatus;
  arquivo_processado_url: string | null;
  concluido_em: string | null;
  concluido_por: string | null;
  criado_em: string;
  tenant?: { id: string; nome_empresa: string; slug: string };
}

export type EnriquecimentoTransacaoTipo = 'compra' | 'consumo' | 'ajuste';

export interface EnriquecimentoTransacao {
  id: string;
  tenant_id: string;
  tipo: EnriquecimentoTransacaoTipo;
  quantidade: number;
  saldo_apos: number;
  descricao: string;
  solicitacao_id: string | null;
  compra_id: string | null;
  criado_em: string;
}

export interface EnriquecimentoSaldoExtrato {
  creditos_saldo: number;
  valor_credito: string;
  transacoes: EnriquecimentoTransacao[];
}

export type EnriquecimentoCompraStatus = 'pendente' | 'pago' | 'cancelado';

export interface EnriquecimentoCompraCredito {
  id: string;
  tenant_id: string;
  quantidade_creditos: number;
  valor_total: string;
  status: EnriquecimentoCompraStatus;
  pix_copia_cola: string | null;
  criado_em: string;
  pago_em: string | null;
  tenant?: { id: string; nome_empresa: string; slug: string };
}

export interface CampanhaResumoTenant {
  id: string;
  nome: string;
  tipo: 'proprio' | 'dripfy';
  status: StatusCampanhaDM;
  prioridade: PrioridadeDM;
  total_contatos: number;
  enviados: number;
  entregues: number;
  falhas: number;
  criado_em: string;
  agendado_para: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type InvoiceStatus = 'pendente' | 'pago' | 'expirado' | 'cancelado';

export interface Invoice {
  id: string;
  tenant_id: string;
  quantidade_creditos: number;
  valor_total: string;
  status: InvoiceStatus;
  gateway: string;
  gateway_payment_id: string | null;
  pix_qrcode_base64: string | null;
  pix_copia_cola: string | null;
  criado_em: string;
  pago_em: string | null;
}

export type CreditoTransacaoTipo = 'compra' | 'consumo' | 'ajuste';

export interface CreditoTransacao {
  id: string;
  tenant_id: string;
  tipo: CreditoTransacaoTipo;
  quantidade: number;
  saldo_apos: number;
  descricao: string;
  campanha_id: string | null;
  invoice_id: string | null;
  criado_em: string;
}

export interface ExtratoCreditos {
  creditos_saldo: number;
  valor_credito: number;
  transacoes: CreditoTransacao[];
}

