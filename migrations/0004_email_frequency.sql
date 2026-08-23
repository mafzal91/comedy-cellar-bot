CREATE TABLE "comic_notification_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"externalId" varchar(128) NOT NULL,
	"actId" integer NOT NULL,
	"notifiedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "comic_notification_queue_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
CREATE TABLE "new_comic_notification" (
	"id" serial PRIMARY KEY NOT NULL,
	"externalId" varchar(128) NOT NULL,
	"userId" integer NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"frequencyMinutes" integer DEFAULT 0 NOT NULL,
	"lastNotifiedAt" timestamp,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "new_comic_notification_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
CREATE TABLE "new_comic_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"comicId" integer NOT NULL,
	"notifiedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "show_notification" ADD COLUMN "frequencyMinutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "show_notification" ADD COLUMN "lastNotifiedAt" timestamp;--> statement-breakpoint
ALTER TABLE "comic_notification_queue" ADD CONSTRAINT "comic_notification_queue_actId_act_id_fk" FOREIGN KEY ("actId") REFERENCES "public"."act"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "new_comic_notification" ADD CONSTRAINT "new_comic_notification_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "new_comic_queue" ADD CONSTRAINT "new_comic_queue_comicId_comic_id_fk" FOREIGN KEY ("comicId") REFERENCES "public"."comic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "queue_act_unique" ON "comic_notification_queue" USING btree ("actId");--> statement-breakpoint
CREATE UNIQUE INDEX "user_new_comic_unique" ON "new_comic_notification" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "queue_comic_unique" ON "new_comic_queue" USING btree ("comicId");--> statement-breakpoint
-- Backfill the new per-user delivery cursor for EXISTING subscribers. Their
-- cursor starts NULL, which the new cron would read as "never notified" and use
-- to re-announce every still-upcoming show/comic already in the queue. Stamping
-- them as caught-up (now()) prevents a re-notification blast on the first tick
-- after deploy. Kept in this same migration, immediately after the column is
-- added, so no cron run can observe a NULL cursor on an existing subscriber.
-- New subscribers created after this keep NULL and correctly get a starter
-- digest. Guarded on IS NULL so re-running the statement is a no-op.
UPDATE "show_notification" SET "lastNotifiedAt" = now() WHERE "lastNotifiedAt" IS NULL;--> statement-breakpoint
UPDATE "new_comic_notification" SET "lastNotifiedAt" = now() WHERE "lastNotifiedAt" IS NULL;