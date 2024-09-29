import { text, serial, varchar, timestamp, pgTable } from "drizzle-orm/pg-core";
import { createExternalId } from "../common/createExternalId";
import { ROOM_PREFIX } from "../common/constants";
import { relations } from "drizzle-orm";
import { show } from "./show.sql";

export const room = pgTable("room", {
  id: serial("id").notNull().primaryKey(),
  externalId: varchar("externalId", { length: 128 })
    .$defaultFn(() => createExternalId(ROOM_PREFIX))
    .notNull()
    .unique(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const usersRelations = relations(room, ({ many }) => ({
  shows: many(show),
}));

export type SelectRoom = typeof room.$inferSelect;
export type InsertRoom = typeof room.$inferInsert &
  Partial<Pick<SelectRoom, "id">>;
