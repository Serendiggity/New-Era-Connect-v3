CREATE TABLE IF NOT EXISTS "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50),
	"entity_id" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255),
	"company" varchar(255),
	"title" varchar(255),
	"phone" varchar(50),
	"linkedin_url" varchar(255),
	"business_card_url" text,
	"ocr_confidence" numeric(3, 2),
	"ocr_raw_data" jsonb,
	"status" varchar(20) DEFAULT 'processing',
	"processed_at" timestamp,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_group_id" integer,
	"template_id" integer,
	"name" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'draft',
	"generated_at" timestamp,
	"exported_at" timestamp,
	"export_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer,
	"contact_id" integer,
	"subject" varchar(500) NOT NULL,
	"body" text NOT NULL,
	"personalization_data" jsonb,
	"exported_at" timestamp,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"body" text NOT NULL,
	"variables" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"date" date NOT NULL,
	"location" varchar(255),
	"industry" varchar(100),
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_group_contacts" (
	"lead_group_id" integer,
	"contact_id" integer,
	"added_at" timestamp DEFAULT now(),
	CONSTRAINT "lead_group_contacts_lead_group_id_contact_id_pk" PRIMARY KEY("lead_group_id","contact_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ocr_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer,
	"status" varchar(20) DEFAULT 'pending',
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_activity_logs_created_at" ON "activity_logs" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_activity_logs_action" ON "activity_logs" ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contacts_event_id" ON "contacts" ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contacts_status" ON "contacts" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contacts_email" ON "contacts" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contacts_processed_at" ON "contacts" ("processed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_campaigns_status" ON "email_campaigns" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_campaigns_generated_at" ON "email_campaigns" ("generated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_drafts_campaign_id" ON "email_drafts" ("campaign_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_drafts_exported_at" ON "email_drafts" ("exported_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ocr_jobs_status" ON "ocr_jobs" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ocr_jobs_contact_id" ON "ocr_jobs" ("contact_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contacts" ADD CONSTRAINT "contacts_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_lead_group_id_lead_groups_id_fk" FOREIGN KEY ("lead_group_id") REFERENCES "lead_groups"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "email_templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_drafts" ADD CONSTRAINT "email_drafts_campaign_id_email_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "email_campaigns"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_drafts" ADD CONSTRAINT "email_drafts_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lead_group_contacts" ADD CONSTRAINT "lead_group_contacts_lead_group_id_lead_groups_id_fk" FOREIGN KEY ("lead_group_id") REFERENCES "lead_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lead_group_contacts" ADD CONSTRAINT "lead_group_contacts_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ocr_jobs" ADD CONSTRAINT "ocr_jobs_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
