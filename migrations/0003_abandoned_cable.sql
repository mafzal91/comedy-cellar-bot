ALTER TABLE "show" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "show" ADD COLUMN "timestamp" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "show" ADD COLUMN "cover" integer;