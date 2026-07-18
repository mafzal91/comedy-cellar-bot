import {
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { COMIC_NOTIFICATION_QUEUE_PREFIX } from "../common/constants";
import { createExternalId } from "../common/createExternalId";
import { relations } from "drizzle-orm";
import { act } from "./act.sql";

// Outbox of comics newly assigned to a show, waiting to be announced to
// subscribers who follow that comic. Rows are written when a new act (the
// comic<->show link) is inserted and cleared (notifiedAt set) once the
// batched "comic booked" email has gone out, so an act is announced at most
// once. Mirrors new_show_queue's outbox + atomic-claim pattern.

export const comicNotificationQueue = pgTable(
  "comic_notification_queue",
  {
    id: serial("id").notNull().primaryKey(),
    externalId: varchar("externalId", { length: 128 })
      .$defaultFn(() => createExternalId(COMIC_NOTIFICATION_QUEUE_PREFIX))
      .notNull()
      .unique(),
    actId: integer("actId")
      .references(() => act.id, { onDelete: "cascade" })
      .notNull(),
    notifiedAt: timestamp("notifiedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    queueActUnique: uniqueIndex("queue_act_unique").on(table.actId),
  })
);

export const comicNotificationQueueRelations = relations(
  comicNotificationQueue,
  ({ one }) => ({
    act: one(act, {
      fields: [comicNotificationQueue.actId],
      references: [act.id],
    }),
  })
);

export type SelectComicNotificationQueue =
  typeof comicNotificationQueue.$inferSelect;
export type InsertComicNotificationQueue =
  typeof comicNotificationQueue.$inferInsert;
