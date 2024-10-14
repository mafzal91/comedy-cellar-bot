import { eq } from "drizzle-orm";
import { db } from "@core/database";
import { user, InsertUser, SelectUser } from "@core/sql/user.sql";
import { USER_PREFIX } from "@core/common/constants";

export function isRoomExternalId(externalId) {
  return externalId.match(new RegExp(USER_PREFIX));
}

export function createUser(data: InsertUser) {
  return db
    .insert(user)
    .values(data)
    .onConflictDoNothing({ target: user.authId });
}

export function deleteUserByAuthId(authId: SelectUser["authId"]) {
  return db.delete(user).where(eq(user.authId, authId));
}

export async function getUser() {
  return db.select().from(user);
}

export async function getUserByExternalId(
  externalId: SelectUser["externalId"]
) {
  return db.select().from(user).where(eq(user.externalId, externalId));
}

export async function getUserByAuthId(authId: SelectUser["authId"]) {
  return db.select().from(user).where(eq(user.authId, authId));
}
