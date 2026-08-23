import {
  boolean,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { NEW_COMIC_NOTIFICATION_PREFIX } from "../common/constants";
import { DEFAULT_FREQUENCY_MINUTES } from "../common/notificationFrequency";
import { createExternalId } from "../common/createExternalId";
import { relations } from "drizzle-orm";
import { user } from "./user.sql";

// Per-user on/off opt-in for "a comic new to the system was added" emails.
// One global row per user (like show_notification), not per comic — the
// per-comic "a comic I follow was booked" preference is comic_notification.

export const newComicNotification = pgTable(
  "new_comic_notification",
  {
    id: serial("id").notNull().primaryKey(),
    externalId: varchar("externalId", { length: 128 })
      .$defaultFn(() => createExternalId(NEW_COMIC_NOTIFICATION_PREFIX))
      .notNull()
      .unique(),
    userId: integer("userId")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    enabled: boolean("enabled").notNull().default(false),
    // How often this user wants the global "new comics" email, as an arbitrary
    // interval in minutes (0 = immediately). See common/notificationFrequency.ts.
    // Only meaningful when enabled.
    frequencyMinutes: integer("frequencyMinutes")
      .notNull()
      .default(DEFAULT_FREQUENCY_MINUTES),
    // When we last sent this user a new-comics digest (per-user delivery
    // cursor). NULL = never notified yet.
    lastNotifiedAt: timestamp("lastNotifiedAt"),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => ({
    userNewComicUnique: uniqueIndex("user_new_comic_unique").on(table.userId),
  })
);

export const newComicNotificationsRelations = relations(
  newComicNotification,
  ({ one }) => ({
    user: one(user, {
      fields: [newComicNotification.userId],
      references: [user.id],
    }),
  })
);

export type SelectNewComicNotification =
  typeof newComicNotification.$inferSelect;
export type InsertNewComicNotification =
  typeof newComicNotification.$inferInsert &
    Partial<Pick<SelectNewComicNotification, "enabled">>;
