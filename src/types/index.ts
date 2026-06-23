export type UserRole = 'admin_master' | 'lojista_admin' | 'atendente';
export type LeadStatus = 'balde_geral' | 'aguardando_resposta' | 'em_atendimento' | 'finalizado';
export type CampaignStatus = 'pausado' | 'rodando' | 'concluido';
export type SubscriptionStatus = 'ativo' | 'inativo' | 'trial';
export type MessageStatus = 'enviado' | 'entregue' | 'lido' | 'erro';

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
  template_name: string;
  status: MessageStatus;
  erro_msg?: string;
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
  disparado: boolean;
  campanha_id?: string;
  criado_em: string;
}

export interface Campaign {
  id: string;
  tenant_id: string;
  nome_campanha: string;
  template_name: string;
  delay_segundos: number;
  status: CampaignStatus;
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

export interface KanbanBoard {
  balde_geral: Lead[];
  aguardando_resposta: Lead[];
  em_atendimento: Lead[];
  finalizado: Lead[];
}
