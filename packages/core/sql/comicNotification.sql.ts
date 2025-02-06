import {
  boolean,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { COMIC_NOTIFICATION_PREFIX } from "../common/constants";
import { comic } from "./comic.sql";
import { createExternalId } from "../common/createExternalId";
import { relations } from "drizzle-orm";
import { user } from "./user.sql";

// This is to notify the user when a comic they are following is assigned to a show
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
    userComicUnique: uniqueIndex("user_comic_unique").on(
      table.userId,
      table.comicId
    ),
  })
);

export const comicNotificationsRelations = relations(
  comicNotification,
  ({ one }) => ({
    user: one(user, {
      fields: [comicNotification.userId],
      references: [user.id],
    }),
    comic: one(comic, {
      fields: [comicNotification.comicId],
      references: [comic.id],
    }),
  })
);

export type SelectComicNotification = typeof comicNotification.$inferSelect;
export type InsertComicNotification = typeof comicNotification.$inferInsert &
  Partial<Pick<SelectComicNotification, "id" | "enabled">>;
