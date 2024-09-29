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
import { act } from "./act.sql";

export const show = pgTable("show", {
  id: serial("id").notNull().primaryKey(),
  externalId: varchar("externalId", { length: 128 })
    .$defaultFn(() => createExternalId(SHOW_PREFIX))
    .notNull()
    .unique(),
  roomId: integer("roomId")
    .references(() => room.id)
    .notNull(),
  description: text("description"),
  timestamp: integer("timestamp"),
  cover: integer("cover"),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const showRelations = relations(show, ({ one, many }) => ({
  room: one(room, { fields: [show.roomId], references: [room.id] }),
  acts: many(act),
}));

export type SelectShow = typeof show.$inferSelect;
export type InsertShow = typeof show.$inferInsert &
  Partial<Omit<SelectShow, "externalId" | "roomId" | "createdAt">>;
