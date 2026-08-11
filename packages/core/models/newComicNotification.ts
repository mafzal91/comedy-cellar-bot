import { and, eq, inArray } from "drizzle-orm";
import { db } from "@core/database";
import {
  newComicNotification,
  SelectNewComicNotification,
  InsertNewComicNotification,
} from "@core/sql/newComicNotification.sql";
import { user } from "@core/sql/user.sql";
import { Resource } from "sst";

const SST_STAGE = Resource.App.stage;

export async function upsertNewComicNotification(
  data: InsertNewComicNotification
) {
  // Only overwrite the fields the caller actually provided so that toggling
  // `enabled` never silently resets a user's chosen `frequency`, and vice versa.
  const set: Partial<
    Pick<InsertNewComicNotification, "enabled" | "frequencyMinutes">
  > = {};
  if (data.enabled !== undefined) set.enabled = data.enabled;
  if (data.frequencyMinutes !== undefined)
    set.frequencyMinutes = data.frequencyMinutes;

  return db
    .insert(newComicNotification)
    .values(data)
    .onConflictDoUpdate({
      target: newComicNotification.userId,
      set,
    });
}

export async function getNewComicNotification(
  userId: SelectNewComicNotification["userId"]
) {
  return db
    .select()
    .from(newComicNotification)
    .where(eq(newComicNotification.userId, userId));
}

// Everyone (for the current stage) who opted in to hear about new comics, with
// the per-user delivery cursor the cron needs to honour their chosen cadence.
// externalId is returned so the cron can mint a per-recipient unsubscribe link.
export async function getNewComicNotificationRecipients() {
  return db
    .select({
      userId: user.id,
      email: user.email,
      externalId: user.externalId,
      frequencyMinutes: newComicNotification.frequencyMinutes,
      lastNotifiedAt: newComicNotification.lastNotifiedAt,
    })
    .from(newComicNotification)
    .innerJoin(user, eq(user.id, newComicNotification.userId))
    .where(
      and(eq(newComicNotification.enabled, true), eq(user.stage, SST_STAGE))
    );
}

// Advance the delivery cursor for the users we just emailed (or are about to).
export async function markNewComicNotificationsNotified(
  userIds: SelectNewComicNotification["userId"][],
  notifiedAt: Date
) {
  if (!userIds.length) return;
  await db
    .update(newComicNotification)
    .set({ lastNotifiedAt: notifiedAt })
    .where(inArray(newComicNotification.userId, userIds));
}
