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
