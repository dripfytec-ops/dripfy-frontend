export type UserRole = 'admin_master' | 'lojista_admin' | 'atendente';
export type LeadStatus = 'balde_geral' | 'aguardando_resposta' | 'em_atendimento' | 'finalizado';
export type SubscriptionStatus = 'ativo' | 'inativo' | 'trial';
export type MessageStatus = 'enviado' | 'entregue' | 'lido' | 'erro';
export type MessageDirection = 'entrada' | 'saida';

export interface Etiqueta {
  id: string;
  tenant_id: string;
  nome: string;
  cor_hexadecimal: string;
  ordem: number;
  slug?: string;
}

// ─── Disparo em Massa (canais oficiais Meta + campanhas em lote) ──────────

export type StatusCampanhaDM = 'rascunho' | 'agendada' | 'em_andamento' | 'concluida' | 'pausada';
export type StatusContatoDM = 'pendente' | 'enviando' | 'enviado' | 'entregue' | 'lido' | 'falha';

export interface CanalDM {
  id: string;
  nome: string;
  waba_id: string;
  phone_number_id: string;
  bm_nome: string | null;
  lote_size: number | null;
  delay_ms: number | null;
  template_boas_vindas: string | null;
  chatwoot_inbox_id: number | null;
  ativo: boolean;
  criado_em: string;
}

export interface CampanhaDM {
  id: string;
  nome: string;
  canal_id: string | null;
  canal?: { id: string; nome: string } | null;
  template_name: string;
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
  moeda: string | null;
  volume_30d: number;
  custo_30d: number;
  custo_medio: number;
  erro: string | null;
}

export interface Message {
  id: string;
  lead_id: number;
  wamid?: string;
  template_name?: string;
  direction: MessageDirection;
  content?: string;
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
  etiqueta_id?: string;
  etiqueta?: Etiqueta;
  vendedor_id?: string;
  vendedor?: Vendedor;
  disparado: boolean;
  iniciado_pelo_cliente: boolean;
  last_message_at?: string;
  last_message_preview?: string;
  unread_count: number;
  criado_em: string;
}

export interface Tenant {
  id: string;
  nome_empresa: string;
  slug: string;
  status_assinatura: SubscriptionStatus;
  criado_em: string;
  _count?: { users: number; leads: number; dm_campanhas?: number };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

