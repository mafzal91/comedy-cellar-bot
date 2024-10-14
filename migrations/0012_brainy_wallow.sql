ALTER TABLE "user" ADD COLUMN "authId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_authId_unique" UNIQUE("authId");