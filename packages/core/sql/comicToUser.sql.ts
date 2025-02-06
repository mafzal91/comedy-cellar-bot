import {
  boolean,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { comic } from "./comic.sql";
import { relations } from "drizzle-orm";
import { user } from "./user.sql";

// This is to track the user's like status for a comic
// Intentionally not using externalId for this table
export const comicToUser = pgTable(
  "comic_to_user",
  {
    id: serial("id").notNull().primaryKey(),
    userId: integer("userId")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    comicId: integer("comicId")
      .references(() => comic.id, { onDelete: "cascade" })
      .notNull(),
    isLiked: boolean("isLiked").notNull().default(false),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => ({
    userComicUnique: uniqueIndex("user_comic_unique1").on(
      table.userId,
      table.comicId
    ),
  })
);

export const comicToUserRelations = relations(comicToUser, ({ one }) => ({
  user: one(user, {
    fields: [comicToUser.userId],
    references: [user.id],
  }),
  comic: one(comic, {
    fields: [comicToUser.comicId],
    references: [comic.id],
  }),
}));

export type SelectComicToUser = typeof comicToUser.$inferSelect;
export type InsertComicToUser = typeof comicToUser.$inferInsert &
  Partial<Pick<SelectComicToUser, "id" | "isLiked">>;
