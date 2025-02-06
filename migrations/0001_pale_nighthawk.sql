CREATE TABLE IF NOT EXISTS "comic_to_user" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"comicId" integer NOT NULL,
	"isLiked" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comic_to_user" ADD CONSTRAINT "comic_to_user_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comic_to_user" ADD CONSTRAINT "comic_to_user_comicId_comic_id_fk" FOREIGN KEY ("comicId") REFERENCES "public"."comic"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_comic_unique1" ON "comic_to_user" USING btree ("userId","comicId");