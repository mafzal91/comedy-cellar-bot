import { handler as runNewShowNotifications } from "./showNotificationCron";
import { handler as runNewComicNotifications } from "./newComicNotificationCron";

// A single cron tick drives every batched subscriber-notification job, so we
// pay for one Lambda invocation per tick instead of one per job. Each job is
// fully independent (its own outbox, opt-in table, recipients, and email) and
// runs in its own try/catch, so a failure in one never blocks the other. Each
// job also self-gates on IS_ACTIVE, so nothing sends outside prod.
export async function handler() {
  try {
    await runNewShowNotifications();
  } catch (e) {
    console.error("new-show notification job failed:", e);
  }

  try {
    await runNewComicNotifications();
  } catch (e) {
    console.error("new-comic notification job failed:", e);
  }

  return {};
}
