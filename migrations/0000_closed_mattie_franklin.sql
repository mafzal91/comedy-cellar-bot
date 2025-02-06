CREATE TABLE IF NOT EXISTS "act" (
	"id" serial PRIMARY KEY NOT NULL,
	"externalId" varchar(128) NOT NULL,
	"showId" integer NOT NULL,
	"comicId" integer NOT NULL,
	"enabled" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "act_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comic" (
	"id" serial PRIMARY KEY NOT NULL,
	"externalId" varchar(128) NOT NULL,
	"img" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"website" text,
	"enabled" boolean,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "comic_externalId_unique" UNIQUE("externalId"),
	CONSTRAINT "comic_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comic_notification" (
	"id" serial PRIMARY KEY NOT NULL,
	"externalId" varchar(128) NOT NULL,
	"userId" integer NOT NULL,
	"comicId" integer NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "comic_notification_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "room" (
	"id" serial PRIMARY KEY NOT NULL,
	"externalId" varchar(128) NOT NULL,
	"name" text NOT NULL,
	"maxReservationSize" integer DEFAULT 4 NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "room_externalId_unique" UNIQUE("externalId"),
	CONSTRAINT "room_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "show" (
	"id" serial PRIMARY KEY NOT NULL,
	"externalId" varchar(128) NOT NULL,
	"time" varchar(8),
	"description" text,
	"forwardUrl" text,
	"soldout" boolean,
	"max" integer,
	"special" boolean,
	"roomId" integer NOT NULL,
	"cover" integer,
	"note" text,
	"mint" boolean,
	"weekday" integer,
	"totalGuests" integer,
	"venueMin" integer,
	"venueMax" integer,
	"available" integer,
	"timestamp" integer,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "show_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "show_notification" (
	"id" serial PRIMARY KEY NOT NULL,
	"externalId" varchar(128) NOT NULL,
	"userId" integer NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "show_notification_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"externalId" varchar(128) NOT NULL,
	"authId" text NOT NULL,
	"email" text NOT NULL,
	"stage" text NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "user_externalId_unique" UNIQUE("externalId"),
	CONSTRAINT "user_authId_unique" UNIQUE("authId")
);
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
DO $$ BEGIN
 ALTER TABLE "comic_notification" ADD CONSTRAINT "comic_notification_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comic_notification" ADD CONSTRAINT "comic_notification_comicId_comic_id_fk" FOREIGN KEY ("comicId") REFERENCES "public"."comic"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "show" ADD CONSTRAINT "show_roomId_room_id_fk" FOREIGN KEY ("roomId") REFERENCES "public"."room"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "show_notification" ADD CONSTRAINT "show_notification_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniqueComicShow" ON "act" USING btree ("comicId","showId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "nameUniqueIndex" ON "comic" USING btree (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_comic_unique" ON "comic_notification" USING btree ("userId","comicId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "emailUniqueIndex" ON "user" USING btree (lower("email"),"stage");