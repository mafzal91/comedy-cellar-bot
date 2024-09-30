CREATE TABLE IF NOT EXISTS "act" (
	"id" serial PRIMARY KEY NOT NULL,
	"externalId" varchar(128) NOT NULL,
	"showId" integer NOT NULL,
	"comicId" integer NOT NULL,
	"enabled" boolean,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "act_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
ALTER TABLE "comic" ADD COLUMN "enabled" boolean;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "act" ADD CONSTRAINT "act_showId_show_id_fk" FOREIGN KEY ("showId") REFERENCES "public"."show"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "act" ADD CONSTRAINT "act_comicId_comic_id_fk" FOREIGN KEY ("comicId") REFERENCES "public"."comic"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniqueComicShow" ON "act" USING btree ("comicId","showId");