import {
  text,
  serial,
  varchar,
  timestamp,
  pgTable,
  integer,
  boolean,
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
  time: varchar("time", { length: 8 }),
  description: text("description"),
  forwardUrl: text("forwardUrl"),
  soldout: boolean("soldout"),
  max: integer("max"),
  special: boolean("special"),
  roomId: integer("roomId")
    .references(() => room.id)
    .notNull(),
  cover: integer("cover"),
  note: text("note"),
  mint: boolean("mint"),
  weekday: integer("weekday"),
  totalGuests: integer("totalGuests"),
  venueMin: integer("venueMin"),
  venueMax: integer("venueMax"),
  available: integer("available"),
  timestamp: integer("timestamp"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const showRelations = relations(show, ({ one, many }) => ({
  room: one(room, { fields: [show.roomId], references: [room.id] }),
  acts: many(act),
}));

export type SelectShow = typeof show.$inferSelect;
export type InsertShow = typeof show.$inferInsert &
  Partial<Omit<SelectShow, "externalId" | "roomId" | "createdAt">>;
