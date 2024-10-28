import {
  serial,
  varchar,
  timestamp,
  pgTable,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createExternalId } from "../common/createExternalId";
import { SHOW_NOTIFICATION_PREFIX } from "../common/constants";
import { relations } from "drizzle-orm";
import { user } from "./user.sql";

export const showNotification = pgTable("show_notification", {
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
});

export const usersRelations = relations(showNotification, ({ one }) => ({
  user: one(user),
}));

export type SelectShowNotification = typeof showNotification.$inferSelect;
export type InsertShowNotification = typeof showNotification.$inferInsert &
  Partial<Pick<SelectShowNotification, "enabled">>;
