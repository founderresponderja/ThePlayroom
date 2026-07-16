DO $$
BEGIN
  ALTER TYPE "moderation_status" ADD VALUE IF NOT EXISTS 'pending_review';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "review_priority" varchar(16) DEFAULT 'normal' NOT NULL;
--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "safe_search_categories" jsonb;
--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "safe_search_reason" varchar(64);
