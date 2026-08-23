ALTER TABLE "new_comic_notification" ADD COLUMN "frequencyMinutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "new_comic_notification" ADD COLUMN "lastNotifiedAt" timestamp;--> statement-breakpoint
ALTER TABLE "show_notification" ADD COLUMN "frequencyMinutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "show_notification" ADD COLUMN "lastNotifiedAt" timestamp;--> statement-breakpoint
-- Backfill the new per-user delivery cursor for EXISTING subscribers. Their
-- cursor starts NULL, which the new cron would read as "never notified" and use
-- to re-announce every still-upcoming show/comic already in the queue. Stamping
-- them as caught-up (now()) prevents a re-notification blast on the first tick
-- after deploy. Kept in this same migration, immediately after the columns are
-- added, so no cron run can observe a NULL cursor on an existing subscriber.
-- New subscribers created after this keep NULL and correctly get a starter
-- digest. Guarded on IS NULL so re-running the statement is a no-op.
UPDATE "show_notification" SET "lastNotifiedAt" = now() WHERE "lastNotifiedAt" IS NULL;--> statement-breakpoint
UPDATE "new_comic_notification" SET "lastNotifiedAt" = now() WHERE "lastNotifiedAt" IS NULL;