
CREATE TABLE IF NOT EXISTS "files" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now())
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "queue" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now())
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"storage" jsonb,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now())
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tiles" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"files" jsonb,
	"key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now())
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"full_name" text,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"avatar_url" text,
	"preferences" jsonb DEFAULT '{"theme":"light"}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "files" ADD CONSTRAINT "files_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tiles" ADD CONSTRAINT "tiles_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
