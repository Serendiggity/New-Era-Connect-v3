-- Migration: Add user_modified_fields to contacts table
-- This field tracks which fields have been manually modified by users
-- to prevent OCR from overwriting user data

ALTER TABLE "contacts" ADD COLUMN "user_modified_fields" jsonb DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN "contacts"."user_modified_fields" IS 'Tracks which fields have been manually modified by users to prevent OCR overwrites. Format: {"full_name": true, "email": true, ...}';