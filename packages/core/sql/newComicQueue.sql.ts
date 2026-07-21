import {
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { NEW_COMIC_QUEUE_PREFIX } from "../common/constants";
import { createExternalId } from "../common/createExternalId";
import { relations } from "drizzle-orm";
import { comic } from "./comic.sql";

// Outbox of comics newly discovered in the system, waiting to be announced.
// A row is written when a comic is first inserted and cleared (notifiedAt set)
// once the batched "new comics" email has gone out, so a comic is announced at
// most once. Mirrors new_show_queue.

export const newComicQueue = pgTable(
  "new_comic_queue",
  {
    id: serial("id").notNull().primaryKey(),
    externalId: varchar("externalId", { length: 128 })
      .$defaultFn(() => createExternalId(NEW_COMIC_QUEUE_PREFIX))
      .notNull()
      .unique(),
    comicId: integer("comicId")
      .references(() => comic.id, { onDelete: "cascade" })
      .notNull(),
    notifiedAt: timestamp("notifiedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    queueComicUnique: uniqueIndex("queue_comic_unique").on(table.comicId),
  })
);

export const newComicQueueRelations = relations(newComicQueue, ({ one }) => ({
  comic: one(comic, {
    fields: [newComicQueue.comicId],
    references: [comic.id],
  }),
}));

export type SelectNewComicQueue = typeof newComicQueue.$inferSelect;
export type InsertNewComicQueue = typeof newComicQueue.$inferInsert;
