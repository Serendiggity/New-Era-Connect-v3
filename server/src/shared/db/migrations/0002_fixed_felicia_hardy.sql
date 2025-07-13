ALTER TABLE "contacts" DROP CONSTRAINT "contacts_event_id_events_id_fk";
--> statement-breakpoint
ALTER TABLE "contacts" ALTER COLUMN "status" SET DEFAULT 'user_verified';--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "user_modified_fields" jsonb DEFAULT '{}';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contacts" ADD CONSTRAINT "contacts_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
