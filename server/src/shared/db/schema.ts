import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  date, 
  timestamp, 
  integer, 
  decimal, 
  jsonb, 
  primaryKey,
  index 
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Events table
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  date: date('date').notNull(),
  location: varchar('location', { length: 255 }),
  industry: varchar('industry', { length: 100 }),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Contacts table
export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id'),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  company: varchar('company', { length: 255 }),
  title: varchar('title', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  linkedinUrl: varchar('linkedin_url', { length: 255 }),
  
  // OCR related
  businessCardUrl: text('business_card_url'),
  ocrConfidence: decimal('ocr_confidence', { precision: 3, scale: 2 }),
  ocrRawData: jsonb('ocr_raw_data'),
  
  // Processing tracking
  status: varchar('status', { length: 20 }).default('processing'),
  processedAt: timestamp('processed_at'),
  reviewedAt: timestamp('reviewed_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  eventIdIdx: index('idx_contacts_event_id').on(table.eventId),
  statusIdx: index('idx_contacts_status').on(table.status),
  emailIdx: index('idx_contacts_email').on(table.email),
  processedAtIdx: index('idx_contacts_processed_at').on(table.processedAt),
}));

// OCR Jobs table (future-proofing)
export const ocrJobs = pgTable('ocr_jobs', {
  id: serial('id').primaryKey(),
  contactId: integer('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).default('pending'),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  statusIdx: index('idx_ocr_jobs_status').on(table.status),
  contactIdIdx: index('idx_ocr_jobs_contact_id').on(table.contactId),
}));

// Lead Groups table
export const leadGroups = pgTable('lead_groups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Lead Group Contacts junction table
export const leadGroupContacts = pgTable('lead_group_contacts', {
  leadGroupId: integer('lead_group_id').references(() => leadGroups.id, { onDelete: 'cascade' }),
  contactId: integer('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at').defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.leadGroupId, table.contactId] }),
}));

// Email Templates table
export const emailTemplates = pgTable('email_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  body: text('body').notNull(),
  variables: text('variables').array(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Email Campaigns table
export const emailCampaigns = pgTable('email_campaigns', {
  id: serial('id').primaryKey(),
  leadGroupId: integer('lead_group_id').references(() => leadGroups.id),
  templateId: integer('template_id').references(() => emailTemplates.id),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('draft'),
  generatedAt: timestamp('generated_at'),
  exportedAt: timestamp('exported_at'),
  exportCount: integer('export_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  statusIdx: index('idx_email_campaigns_status').on(table.status),
  generatedAtIdx: index('idx_email_campaigns_generated_at').on(table.generatedAt),
}));

// Email Drafts table
export const emailDrafts = pgTable('email_drafts', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id').references(() => emailCampaigns.id, { onDelete: 'cascade' }),
  contactId: integer('contact_id').references(() => contacts.id),
  subject: varchar('subject', { length: 500 }).notNull(),
  body: text('body').notNull(),
  personalizationData: jsonb('personalization_data'),
  
  // Export tracking
  exportedAt: timestamp('exported_at'),
  sentAt: timestamp('sent_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  campaignIdIdx: index('idx_email_drafts_campaign_id').on(table.campaignId),
  exportedAtIdx: index('idx_email_drafts_exported_at').on(table.exportedAt),
}));

// Activity Logs table
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: integer('entity_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  createdAtIdx: index('idx_activity_logs_created_at').on(table.createdAt),
  actionIdx: index('idx_activity_logs_action').on(table.action),
}));

// Relations
export const eventsRelations = relations(events, ({ many }) => ({
  contacts: many(contacts),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  event: one(events, {
    fields: [contacts.eventId],
    references: [events.id],
  }),
  ocrJobs: many(ocrJobs),
  leadGroupContacts: many(leadGroupContacts),
  emailDrafts: many(emailDrafts),
}));

export const ocrJobsRelations = relations(ocrJobs, ({ one }) => ({
  contact: one(contacts, {
    fields: [ocrJobs.contactId],
    references: [contacts.id],
  }),
}));

export const leadGroupsRelations = relations(leadGroups, ({ many }) => ({
  leadGroupContacts: many(leadGroupContacts),
  emailCampaigns: many(emailCampaigns),
}));

export const leadGroupContactsRelations = relations(leadGroupContacts, ({ one }) => ({
  leadGroup: one(leadGroups, {
    fields: [leadGroupContacts.leadGroupId],
    references: [leadGroups.id],
  }),
  contact: one(contacts, {
    fields: [leadGroupContacts.contactId],
    references: [contacts.id],
  }),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({ many }) => ({
  emailCampaigns: many(emailCampaigns),
}));

export const emailCampaignsRelations = relations(emailCampaigns, ({ one, many }) => ({
  leadGroup: one(leadGroups, {
    fields: [emailCampaigns.leadGroupId],
    references: [leadGroups.id],
  }),
  template: one(emailTemplates, {
    fields: [emailCampaigns.templateId],
    references: [emailTemplates.id],
  }),
  emailDrafts: many(emailDrafts),
}));

export const emailDraftsRelations = relations(emailDrafts, ({ one }) => ({
  campaign: one(emailCampaigns, {
    fields: [emailDrafts.campaignId],
    references: [emailCampaigns.id],
  }),
  contact: one(contacts, {
    fields: [emailDrafts.contactId],
    references: [contacts.id],
  }),
}));

// Export all table schemas for use in other files
export const schema = {
  events,
  contacts,
  ocrJobs,
  leadGroups,
  leadGroupContacts,
  emailTemplates,
  emailCampaigns,
  emailDrafts,
  activityLogs,
};