import { InsertRoom, SelectRoom, room } from "@core/sql/room.sql";

import { ROOM_PREFIX } from "@core/common/constants";
import { db } from "@core/database";
import { eq } from "drizzle-orm";

export function isRoomExternalId(externalId) {
  return externalId.match(new RegExp(ROOM_PREFIX));
}

export function createRooms(data: InsertRoom[]) {
  return db.insert(room).values(data).onConflictDoNothing({ target: room.id });
}

export function createRoom(data: InsertRoom) {
  return createRooms([data]);
}

export async function getRooms() {
  return db.select().from(room);
}

export async function getRoomByExternalId(
  externalId: SelectRoom["externalId"]
) {
  return db
    .select()
    .from(room)
    .where(eq(room.externalId, externalId))
    .limit(1)
    .then(([room]) => room);
}

export async function getRoomById(id: SelectRoom["id"]) {
  return db
    .select()
    .from(room)
    .where(eq(room.id, id))
    .limit(1)
    .then(([room]) => room);
}
