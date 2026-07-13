CREATE TABLE "new_show_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"externalId" varchar(128) NOT NULL,
	"showId" integer NOT NULL,
	"notifiedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "new_show_queue_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
ALTER TABLE "new_show_queue" ADD CONSTRAINT "new_show_queue_showId_show_id_fk" FOREIGN KEY ("showId") REFERENCES "public"."show"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "queue_show_unique" ON "new_show_queue" USING btree ("showId");