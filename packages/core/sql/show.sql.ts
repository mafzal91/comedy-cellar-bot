import {
  text,
  serial,
  varchar,
  timestamp,
  pgTable,
  integer,
} from "drizzle-orm/pg-core";
import { createExternalId } from "../common/createExternalId";
import { SHOW_PREFIX } from "../common/constants";
import { relations } from "drizzle-orm";
import { room } from "./room.sql";

export const show = pgTable("show", {
  id: serial("id").notNull().primaryKey(),
  externalId: varchar("externalId", { length: 128 })
    .$defaultFn(() => createExternalId(SHOW_PREFIX))
    .notNull()
    .unique(),
  roomId: integer("roomId")
    .references(() => room.id)
    .notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const showRelations = relations(show, ({ one }) => ({
  room: one(room, { fields: [show.roomId], references: [room.id] }),
}));

export type SelectShow = typeof show.$inferSelect;
export type InsertShow = typeof show.$inferInsert;
