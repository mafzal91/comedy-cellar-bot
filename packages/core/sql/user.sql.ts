import { One, relations, sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { USER_PREFIX } from "../common/constants";
import { comicNotification } from "./comicNotification.sql";
import { comicToUser } from "./comicToUser.sql";
import { createExternalId } from "../common/createExternalId";
import { showNotification } from "./showNotification.sql";

export const user = pgTable(
  "user",
  {
    id: serial("id").notNull().primaryKey(),
    externalId: varchar("externalId", { length: 128 })
      .$defaultFn(() => createExternalId(USER_PREFIX))
      .notNull()
      .unique(),
    authId: text("authId").notNull().unique(),
    email: text("email").notNull(),
    stage: text("stage").notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => ({
    emailUniqueIndex: uniqueIndex("emailUniqueIndex").on(
      sql`lower(${table.email})`,
      table.stage
    ),
  })
);

export const usersRelations = relations(user, ({ one, many }) => ({
  showNotifications: one(showNotification, {
    fields: [user.id],
    references: [showNotification.userId],
  }),
  comicNotifications: many(comicNotification),
  comicToUsers: many(comicToUser),
}));

export type SelectUser = typeof user.$inferSelect;
export type InsertUser = typeof user.$inferInsert;

// Create a type guard to check if the value is a user
export function isUser(value: any): value is SelectUser {
  return (
    value &&
    typeof value === "object" &&
    value.externalId &&
    value.externalId.match(new RegExp(USER_PREFIX))
  );
}
