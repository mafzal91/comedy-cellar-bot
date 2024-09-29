ALTER TABLE "act" DROP CONSTRAINT "act_showId_show_id_fk";
--> statement-breakpoint
ALTER TABLE "act" DROP CONSTRAINT "act_comicId_comic_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "act" ADD CONSTRAINT "act_showId_show_id_fk" FOREIGN KEY ("showId") REFERENCES "public"."show"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "act" ADD CONSTRAINT "act_comicId_comic_id_fk" FOREIGN KEY ("comicId") REFERENCES "public"."comic"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "nameUniqueIndex" ON "comic" USING btree (lower("name"));