import { and, eq, inArray } from "drizzle-orm";
import { db } from "@core/database";
import {
  showNotification,
  SelectShowNotification,
  InsertShowNotification,
} from "@core/sql/showNotification.sql";
import { user } from "@core/sql/user.sql";
import { Resource } from "sst";

const SST_STAGE = Resource.App.stage;

export async function upsertShowNotification(data: InsertShowNotification) {
  // Only overwrite the fields the caller actually provided so that toggling
  // `enabled` never silently resets a user's chosen `frequency`, and vice versa.
  const set: Partial<
    Pick<InsertShowNotification, "enabled" | "frequencyMinutes">
  > = {};
  if (data.enabled !== undefined) set.enabled = data.enabled;
  if (data.frequencyMinutes !== undefined)
    set.frequencyMinutes = data.frequencyMinutes;

  return db
    .insert(showNotification)
    .values(data)
    .onConflictDoUpdate({
      target: showNotification.userId,
      set,
    });
}

export async function getShowNotification(
  userId: SelectShowNotification["id"]
) {
  return db
    .select()
    .from(showNotification)
    .where(eq(showNotification.userId, userId));
}

// Everyone (for the current stage) who opted in to hear about new shows, with
// the per-user delivery cursor the cron needs to honour their chosen cadence.
// externalId is returned so the cron can mint a per-recipient unsubscribe link.
export async function getShowNotificationRecipients() {
  return db
    .select({
      userId: user.id,
      email: user.email,
      externalId: user.externalId,
      frequencyMinutes: showNotification.frequencyMinutes,
      lastNotifiedAt: showNotification.lastNotifiedAt,
    })
    .from(showNotification)
    .innerJoin(user, eq(user.id, showNotification.userId))
    .where(
      and(eq(showNotification.enabled, true), eq(user.stage, SST_STAGE))
    );
}

// Advance the delivery cursor for the users we just emailed (or are about to).
export async function markShowNotificationsNotified(
  userIds: SelectShowNotification["userId"][],
  notifiedAt: Date
) {
  if (!userIds.length) return;
  await db
    .update(showNotification)
    .set({ lastNotifiedAt: notifiedAt })
    .where(inArray(showNotification.userId, userIds));
}
