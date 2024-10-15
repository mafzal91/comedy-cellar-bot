import { and, eq } from "drizzle-orm";
import { db } from "@core/database";
import { user, InsertUser, SelectUser } from "@core/sql/user.sql";
import { USER_PREFIX } from "@core/common/constants";
import { Resource } from "sst";

const SST_STAGE = Resource.App.stage;

function applyWhere(...conditions) {
  return and(...conditions, eq(user.stage, SST_STAGE));
}

export function isRoomExternalId(externalId) {
  return externalId.match(new RegExp(USER_PREFIX));
}

export function createUser(data: Omit<InsertUser, "stage">) {
  return db
    .insert(user)
    .values({ ...data, stage: SST_STAGE })
    .onConflictDoNothing({ target: user.authId });
}

export function deleteUserByAuthId(authId: SelectUser["authId"]) {
  return db.delete(user).where(applyWhere(eq(user.authId, authId)));
}

export async function getUser() {
  return db.select().from(user).where(applyWhere([]));
}

export async function getUserByExternalId(
  externalId: SelectUser["externalId"]
) {
  return db
    .select()
    .from(user)
    .where(applyWhere(eq(user.externalId, externalId)));
}

export async function getUserByAuthId(authId: SelectUser["authId"]) {
  return db
    .select()
    .from(user)
    .where(applyWhere(eq(user.authId, authId)));
}
