import { ID, Timestamp } from './common.js';

export type ActivityAction = 
  // Contact actions
  | 'contact_uploaded'
  | 'contact_processed'
  | 'contact_reviewed'
  | 'contact_verified'
  // Event actions
  | 'event_created'
  | 'event_updated'
  | 'event_deleted'
  // Lead group actions
  | 'lead_group_created'
  | 'contacts_added_to_group'
  | 'contacts_removed_from_group'
  // Email actions
  | 'email_campaign_created'
  | 'email_drafts_generated'
  | 'email_campaign_exported';

export type EntityType = 'contact' | 'event' | 'email_campaign' | 'lead_group';

export interface ActivityLog {
  id: ID;
  action: ActivityAction;
  entity_type?: EntityType;
  entity_id?: ID;
  metadata?: Record<string, any>;
  created_at: Timestamp;
}

export interface CreateActivityLogInput {
  action: ActivityAction;
  entity_type?: EntityType;
  entity_id?: ID;
  metadata?: Record<string, any>;
}