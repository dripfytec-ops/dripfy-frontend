export type UserRole = 'admin_master' | 'lojista_admin' | 'atendente';
export type LeadStatus = 'balde_geral' | 'aguardando_resposta' | 'em_atendimento' | 'finalizado';
export type CampaignStatus = 'pausado' | 'rodando' | 'concluido';
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

export interface Canal {
  id: string;
  nome: string;
  phone_number_id: string;
  waba_id: string;
  template_boas_vindas?: string;
  chatwoot_inbox_id?: number;
  ativo: boolean;
  criado_em: string;
}

export interface Message {
  id: string;
  lead_id: number;
  campanha_id?: string;
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
  campanha_id?: string;
  last_message_at?: string;
  last_message_preview?: string;
  unread_count: number;
  criado_em: string;
}

export interface Campaign {
  id: string;
  tenant_id: string;
  nome_campanha: string;
  template_name: string;
  delay_segundos: number;
  status: CampaignStatus;
  canal?: { id: string; nome: string; phone_number_id: string };
  total_leads: number;
  enviados: number;
  erros: number;
  criado_em: string;
}

export interface Tenant {
  id: string;
  nome_empresa: string;
  slug: string;
  status_assinatura: SubscriptionStatus;
  criado_em: string;
  _count?: { users: number; leads: number };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

