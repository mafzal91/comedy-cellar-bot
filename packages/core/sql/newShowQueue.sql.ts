import {
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { NEW_SHOW_QUEUE_PREFIX } from "../common/constants";
import { createExternalId } from "../common/createExternalId";
import { relations } from "drizzle-orm";
import { show } from "./show.sql";

// Outbox of newly discovered shows waiting to be announced. Rows are written
// when a show is first inserted and cleared (notifiedAt set) once the batched
// "new shows" email has gone out, so a show is announced at most once.

export const newShowQueue = pgTable(
  "new_show_queue",
  {
    id: serial("id").notNull().primaryKey(),
    externalId: varchar("externalId", { length: 128 })
      .$defaultFn(() => createExternalId(NEW_SHOW_QUEUE_PREFIX))
      .notNull()
      .unique(),
    showId: integer("showId")
      .references(() => show.id, { onDelete: "cascade" })
      .notNull(),
    notifiedAt: timestamp("notifiedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    queueShowUnique: uniqueIndex("queue_show_unique").on(table.showId),
  })
);

export const newShowQueueRelations = relations(newShowQueue, ({ one }) => ({
  show: one(show, {
    fields: [newShowQueue.showId],
    references: [show.id],
  }),
}));

export type SelectNewShowQueue = typeof newShowQueue.$inferSelect;
export type InsertNewShowQueue = typeof newShowQueue.$inferInsert;
