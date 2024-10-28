import {
  serial,
  varchar,
  timestamp,
  pgTable,
  integer,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createExternalId } from "../common/createExternalId";
import { COMIC_NOTIFICATION_PREFIX } from "../common/constants";
import { relations } from "drizzle-orm";
import { user } from "./user.sql";
import { comic } from "./comic.sql";

export const comicNotification = pgTable(
  "comic_notification",
  {
    id: serial("id").notNull().primaryKey(),
    externalId: varchar("externalId", { length: 128 })
      .$defaultFn(() => createExternalId(COMIC_NOTIFICATION_PREFIX))
      .notNull()
      .unique(),
    userId: integer("userId")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    comicId: integer("comicId")
      .references(() => comic.id, { onDelete: "cascade" })
      .notNull(),
    enabled: boolean("enabled").notNull().default(false),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => ({
    emailUsernameUnique: uniqueIndex("user_comic_unique").on(
      table.userId,
      table.comicId
    ),
  })
);

export const usersRelations = relations(comicNotification, ({ one }) => ({
  user: one(user),
  comic: one(comic),
}));

export type SelectComicNotification = typeof comicNotification.$inferSelect;
export type InsertComicNotification = typeof comicNotification.$inferInsert &
  Partial<Pick<SelectComicNotification, "id" | "enabled">>;
