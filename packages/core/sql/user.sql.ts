import {
  text,
  serial,
  varchar,
  timestamp,
  pgTable,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createExternalId } from "../common/createExternalId";
import { USER_PREFIX } from "../common/constants";
import { sql } from "drizzle-orm";

export const user = pgTable(
  "user",
  {
    id: serial("id").notNull().primaryKey(),
    externalId: varchar("externalId", { length: 128 })
      .$defaultFn(() => createExternalId(USER_PREFIX))
      .notNull()
      .unique(),
    authId: text("authId").notNull().unique(),
    email: text("email").notNull().unique(),
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
