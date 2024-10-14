DROP INDEX IF EXISTS "emailUniqueIndex";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "emailUniqueIndex" ON "user" USING btree (lower("email"),"stage");