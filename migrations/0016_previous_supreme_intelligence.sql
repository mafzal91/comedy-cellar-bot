ALTER TABLE "show_notification" ALTER COLUMN "enabled" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "show_notification" ALTER COLUMN "enabled" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "comic_notification" ADD COLUMN "enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_comic_unique" ON "comic_notification" USING btree ("userId","comicId");