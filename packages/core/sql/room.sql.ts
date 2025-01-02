import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { ROOM_PREFIX } from "../common/constants";
import { createExternalId } from "../common/createExternalId";
import { relations } from "drizzle-orm";
import { show } from "./show.sql";

export const room = pgTable("room", {
  id: serial("id").notNull().primaryKey(),
  externalId: varchar("externalId", { length: 128 })
    .$defaultFn(() => createExternalId(ROOM_PREFIX))
    .notNull()
    .unique(),
  name: text("name").notNull().unique(),
  maxReservationSize: integer("maxReservationSize").notNull().default(4),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const usersRelations = relations(room, ({ many }) => ({
  shows: many(show),
}));

export type SelectRoom = typeof room.$inferSelect;
export type InsertRoom = typeof room.$inferInsert &
  Partial<Pick<SelectRoom, "id">>;
