import { eq } from "drizzle-orm";
import { db } from "@core/database";
import { room, InsertRoom, SelectRoom } from "@core/sql/room.sql";
import { ROOM_PREFIX } from "@core/common/constants";

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
  return db.select().from(room).where(eq(room.externalId, externalId));
}
