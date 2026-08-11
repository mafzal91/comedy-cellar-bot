import {
  boolean,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { SHOW_NOTIFICATION_PREFIX } from "../common/constants";
import { DEFAULT_NOTIFICATION_FREQUENCY } from "../common/notificationFrequency";
import { createExternalId } from "../common/createExternalId";
import { relations } from "drizzle-orm";
import { user } from "./user.sql";

// This is to notify the user when new shows are added to the system

export const showNotification = pgTable(
  "show_notification",
  {
    id: serial("id").notNull().primaryKey(),
    externalId: varchar("externalId", { length: 128 })
      .$defaultFn(() => createExternalId(SHOW_NOTIFICATION_PREFIX))
      .notNull()
      .unique(),
    userId: integer("userId")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    enabled: boolean("enabled").notNull().default(false),
    // How often this user wants the global "new shows" email. See
    // common/notificationFrequency.ts. Only meaningful when enabled.
    frequency: varchar("frequency", { length: 16 })
      .notNull()
      .default(DEFAULT_NOTIFICATION_FREQUENCY),
    // When we last sent this user a new-shows digest (per-user delivery
    // cursor). NULL = never notified yet.
    lastNotifiedAt: timestamp("lastNotifiedAt"),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => ({
    userShowUnique: uniqueIndex("user_show_unique").on(table.userId),
  })
);

export const showNotificationsRelations = relations(
  showNotification,
  ({ one }) => ({
    user: one(user, {
      fields: [showNotification.userId],
      references: [user.id],
    }),
  })
);

export type SelectShowNotification = typeof showNotification.$inferSelect;
export type InsertShowNotification = typeof showNotification.$inferInsert &
  Partial<Pick<SelectShowNotification, "enabled">>;
