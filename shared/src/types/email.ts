import { BaseEntity, ID, Timestamp } from './common.js';

export type EmailCampaignStatus = 
  | 'draft'
  | 'generating'
  | 'ready'
  | 'exported';

export interface EmailTemplate extends BaseEntity {
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface CreateEmailTemplateInput {
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface UpdateEmailTemplateInput extends Partial<CreateEmailTemplateInput> {}

export interface EmailCampaign extends BaseEntity {
  lead_group_id: ID;
  template_id: ID;
  name: string;
  status: EmailCampaignStatus;
  generated_at?: Timestamp;
  exported_at?: Timestamp;
  export_count: number;
}

export interface CreateEmailCampaignInput {
  lead_group_id: ID;
  template_id: ID;
  name: string;
}

export interface EmailDraft extends BaseEntity {
  campaign_id: ID;
  contact_id: ID;
  subject: string;
  body: string;
  personalization_data?: Record<string, any>;
  exported_at?: Timestamp;
  sent_at?: Timestamp;
}

export interface GenerateEmailsInput {
  campaign_id: ID;
}

export interface ExportCampaignInput {
  campaign_id: ID;
  format: 'gmail_merge' | 'contact_list' | 'full_details';
}