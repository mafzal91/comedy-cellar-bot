CREATE TABLE IF NOT EXISTS "comic_notification" (
	"id" serial PRIMARY KEY NOT NULL,
	"externalId" varchar(128) NOT NULL,
	"userId" integer NOT NULL,
	"comicId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "comic_notification_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "show_notification" (
	"id" serial PRIMARY KEY NOT NULL,
	"externalId" varchar(128) NOT NULL,
	"userId" integer NOT NULL,
	"enabled" boolean,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "show_notification_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comic_notification" ADD CONSTRAINT "comic_notification_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comic_notification" ADD CONSTRAINT "comic_notification_comicId_comic_id_fk" FOREIGN KEY ("comicId") REFERENCES "public"."comic"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "show_notification" ADD CONSTRAINT "show_notification_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
