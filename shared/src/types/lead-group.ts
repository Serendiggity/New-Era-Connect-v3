import { BaseEntity, ID, Timestamp } from './common.js';
import { Contact } from './contact.js';

export interface LeadGroup extends BaseEntity {
  name: string;
  description?: string;
}

export interface CreateLeadGroupInput {
  name: string;
  description?: string;
}

export interface UpdateLeadGroupInput extends Partial<CreateLeadGroupInput> {}

export interface LeadGroupContact {
  lead_group_id: ID;
  contact_id: ID;
  added_at: Timestamp;
}

export interface LeadGroupWithContacts extends LeadGroup {
  contacts: Contact[];
  contact_count: number;
}