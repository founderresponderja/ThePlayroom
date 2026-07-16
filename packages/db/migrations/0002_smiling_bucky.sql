DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conrelid = 'profiles'::regclass
		  AND contype = 'p'
	) THEN
		ALTER TABLE "profiles" ADD PRIMARY KEY ("user_id");
	END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conrelid = 'subscriptions'::regclass
		  AND contype = 'p'
	) THEN
		ALTER TABLE "subscriptions" ADD PRIMARY KEY ("user_id");
	END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
		  AND table_name = 'quiz_results'
		  AND column_name = 'id'
	) THEN
		ALTER TABLE "quiz_results" ADD COLUMN "id" serial NOT NULL;
	END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conrelid = 'quiz_results'::regclass
		  AND contype = 'p'
	) THEN
		ALTER TABLE "quiz_results" ADD PRIMARY KEY ("id");
	END IF;
END $$;