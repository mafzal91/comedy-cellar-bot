ALTER TABLE "show" ADD COLUMN "time" varchar(8);--> statement-breakpoint
ALTER TABLE "show" ADD COLUMN "forwardUrl" text;--> statement-breakpoint
ALTER TABLE "show" ADD COLUMN "soldout" boolean;--> statement-breakpoint
ALTER TABLE "show" ADD COLUMN "max" integer;--> statement-breakpoint
ALTER TABLE "show" ADD COLUMN "special" boolean;--> statement-breakpoint
ALTER TABLE "show" ADD COLUMN "mint" boolean;--> statement-breakpoint
ALTER TABLE "show" ADD COLUMN "weekday" integer;--> statement-breakpoint
ALTER TABLE "show" ADD COLUMN "totalGuests" integer;--> statement-breakpoint
ALTER TABLE "show" ADD COLUMN "venueMin" integer;--> statement-breakpoint
ALTER TABLE "show" ADD COLUMN "venueMax" integer;--> statement-breakpoint
ALTER TABLE "show" ADD COLUMN "available" integer;