-- Catch-up migration. The new_comic_notification / new_comic_queue /
-- comic_notification_queue tables were introduced by #80 via drizzle-kit push
-- and never captured in a migration, so they already exist in the shared DB
-- while the migration lineage (0000-0003) does not create them. This migration
-- records them so the lineage matches reality. It is written idempotently
-- (IF NOT EXISTS + guarded constraints) so it is a NO-OP on the existing DB and
-- still recreates the tables on a fresh database.

CREATE TABLE IF NOT EXISTS "comic_notification_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"externalId" varchar(128) NOT NULL,
	"actId" integer NOT NULL,
	"notifiedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "comic_notification_queue_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "new_comic_notification" (
	"id" serial PRIMARY KEY NOT NULL,
	"externalId" varchar(128) NOT NULL,
	"userId" integer NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "new_comic_notification_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "new_comic_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"comicId" integer NOT NULL,
	"notifiedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "comic_notification_queue" ADD CONSTRAINT "comic_notification_queue_actId_act_id_fk" FOREIGN KEY ("actId") REFERENCES "public"."act"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "new_comic_notification" ADD CONSTRAINT "new_comic_notification_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "new_comic_queue" ADD CONSTRAINT "new_comic_queue_comicId_comic_id_fk" FOREIGN KEY ("comicId") REFERENCES "public"."comic"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "queue_act_unique" ON "comic_notification_queue" USING btree ("actId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_new_comic_unique" ON "new_comic_notification" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "queue_comic_unique" ON "new_comic_queue" USING btree ("comicId");
