DO $$ BEGIN
 CREATE TYPE "account_type" AS ENUM('FEMALE_SINGLE', 'MALE_SINGLE', 'COUPLE_MF', 'COUPLE_MM', 'COUPLE_FF', 'SWING_CLUB', 'SEX_SHOP');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "csam_scan_status" AS ENUM('pending', 'clean', 'flagged', 'error');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "moderation_status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "order_status" AS ENUM('pending', 'paid', 'shipped', 'delivered', 'refunded', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "push_platform" AS ENUM('web', 'expo');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "reservation_status" AS ENUM('requested', 'accepted', 'declined', 'waitlist');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "subscription_tier" AS ENUM('free', 'vip');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "verification_level" AS ENUM('none', 'photo', 'video', 'social');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_user_id" integer,
	"action" varchar(128) NOT NULL,
	"resource_type" varchar(64) NOT NULL,
	"resource_id" integer,
	"data" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clubs" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_user_id" integer NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"location" jsonb,
	"address" text,
	"amenities" jsonb DEFAULT '[]' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "consents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"policy" varchar(128) NOT NULL,
	"version" varchar(64) NOT NULL,
	"accepted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entitlements" (
	"user_id" integer NOT NULL,
	"feature" varchar(128) NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"source" varchar(128) DEFAULT 'stripe' NOT NULL,
	CONSTRAINT "entitlements_user_id_feature_pk" PRIMARY KEY("user_id","feature")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_type" varchar(32) NOT NULL,
	"creator_id" integer NOT NULL,
	"club_id" integer,
	"title" varchar(250) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp,
	"location_mode" varchar(32) NOT NULL,
	"custom_location" jsonb,
	"capacity" integer,
	"privacy" varchar(32) DEFAULT 'public' NOT NULL,
	"ticketed" boolean DEFAULT false NOT NULL,
	"price_cents" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_a_id" integer NOT NULL,
	"user_b_id" integer NOT NULL,
	"algo" varchar(32) DEFAULT 'random' NOT NULL,
	"score" integer,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"encrypted_payload" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(128) NOT NULL,
	"payload" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"shop_id" integer NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"fee_cents" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"buyer_user_id" integer NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"payment_intent_id" varchar(191),
	"total_cents" integer DEFAULT 0 NOT NULL,
	"platform_fee_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"stripe_transfer_id" varchar(191),
	"amount_cents" integer DEFAULT 0 NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"period_ref" varchar(64)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"url" text NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"moderation_status" "moderation_status" DEFAULT 'pending' NOT NULL,
	"csam_scan_status" "csam_scan_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"title" varchar(250) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"images" jsonb DEFAULT '[]' NOT NULL,
	"price_cents" integer NOT NULL,
	"currency" varchar(8) DEFAULT 'EUR' NOT NULL,
	"category" varchar(128) NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"age_restricted" boolean DEFAULT true NOT NULL,
	"moderation_status" "moderation_status" DEFAULT 'pending' NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"user_id" integer NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"preferences" jsonb DEFAULT '{}' NOT NULL,
	"interests" jsonb DEFAULT '[]' NOT NULL,
	"boundaries" jsonb DEFAULT '[]' NOT NULL,
	"approx_location" jsonb,
	"real_location" text,
	"visibility_settings" jsonb DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"platform" "push_platform" DEFAULT 'web' NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text,
	"auth" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quiz_results" (
	"user_id" integer NOT NULL,
	"quiz_version" varchar(64) NOT NULL,
	"account_type_at_time" varchar(32) NOT NULL,
	"answers" jsonb DEFAULT '[]' NOT NULL,
	"derived_tags" jsonb DEFAULT '[]' NOT NULL,
	"archetype" varchar(128),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_user_id" integer,
	"target_type" varchar(64) NOT NULL,
	"target_id" integer NOT NULL,
	"reason" text NOT NULL,
	"evidence" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(32) DEFAULT 'open' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"status" "reservation_status" DEFAULT 'requested' NOT NULL,
	"priority_score" integer DEFAULT 0 NOT NULL,
	"payment_intent_id" varchar(191),
	"location_revealed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shops" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_user_id" integer NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"logo_url" text,
	"stripe_connect_account_id" varchar(191),
	"payouts_enabled" boolean DEFAULT false NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"user_id" integer NOT NULL,
	"stripe_customer_id" varchar(191) NOT NULL,
	"stripe_subscription_id" varchar(191) NOT NULL,
	"plan" varchar(100) NOT NULL,
	"status" varchar(64) NOT NULL,
	"current_period_end" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"participant_a_id" integer NOT NULL,
	"participant_b_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" varchar(191) NOT NULL,
	"account_type" "account_type" NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"date_of_birth" timestamp,
	"age_verified_at" timestamp,
	"verification_level" "verification_level" DEFAULT 'none' NOT NULL,
	"onboarding_complete" boolean DEFAULT false NOT NULL,
	"subscription_tier" "subscription_tier" DEFAULT 'free',
	"is_vip" boolean DEFAULT false NOT NULL,
	"public_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	"deleted_by" varchar(191),
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(32) NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"reviewed_by" integer,
	"evidence_ref" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clubs" ADD CONSTRAINT "clubs_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "consents" ADD CONSTRAINT "consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_user_a_id_users_id_fk" FOREIGN KEY ("user_a_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_user_b_id_users_id_fk" FOREIGN KEY ("user_b_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "threads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_user_id_users_id_fk" FOREIGN KEY ("buyer_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payouts" ADD CONSTRAINT "payouts_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "photos" ADD CONSTRAINT "photos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quiz_results" ADD CONSTRAINT "quiz_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reservations" ADD CONSTRAINT "reservations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shops" ADD CONSTRAINT "shops_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "threads" ADD CONSTRAINT "threads_participant_a_id_users_id_fk" FOREIGN KEY ("participant_a_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "threads" ADD CONSTRAINT "threads_participant_b_id_users_id_fk" FOREIGN KEY ("participant_b_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verifications" ADD CONSTRAINT "verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verifications" ADD CONSTRAINT "verifications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
