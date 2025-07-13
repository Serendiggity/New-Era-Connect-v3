-- Simple fix for contact status default
ALTER TABLE "contacts" ALTER COLUMN "status" SET DEFAULT 'user_verified';