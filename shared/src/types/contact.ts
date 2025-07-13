import { BaseEntity, ID, Timestamp } from './common.js';

export type ContactStatus = 
  | 'processing'
  | 'completed'
  | 'failed'
  | 'pending_review'
  | 'user_verified';

export interface Contact extends BaseEntity {
  event_id?: ID;
  full_name: string;
  email?: string;
  company?: string;
  title?: string;
  phone?: string;
  linkedin_url?: string;
  
  // OCR related
  business_card_url?: string;
  ocr_confidence?: number; // 0.00 to 1.00
  ocr_raw_data?: Record<string, any>;
  
  // User modification tracking - prevents OCR from overwriting manual edits
  user_modified_fields?: Record<string, boolean>;
  
  // Processing tracking
  status: ContactStatus;
  processed_at?: Timestamp;
  reviewed_at?: Timestamp;
}

export interface CreateContactInput {
  event_id?: ID;
  full_name: string;
  email?: string;
  company?: string;
  title?: string;
  phone?: string;
  linkedin_url?: string;
  business_card_url?: string;
}

export interface UpdateContactInput extends Partial<Omit<Contact, keyof BaseEntity | 'event_id'>> {}

export interface ContactWithEvent extends Contact {
  event: {
    name: string;
    date: string;
  };
}