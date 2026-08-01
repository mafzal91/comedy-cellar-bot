import { upsertShowNotification } from "@core/models/showNotification";
import { upsertNewComicNotification } from "@core/models/newComicNotification";
import { getUserByExternalId } from "@core/models/user";

// One-click email unsubscribe.
//
// The link in each email carries an *opaque per-user token*: the recipient's
// `externalId` (an unguessable cuid2 we already mint for every user) joined to
// the notification channel it should turn off. The token itself is the
// capability — no login required — and because `externalId` is random it can't
// be guessed to unsubscribe someone else. Worst case, a leaked token toggles
// one notification channel off (low harm, re-enabled from the profile page), so
// a plain opaque token is sufficient here and avoids introducing a new signing
// secret.

export const UnsubscribeChannel = {
  // "new shows just hit the calendar" batch email (showNotificationCron)
  NEW_SHOWS: "NEW_SHOWS",
  // "new comics discovered" batch email (newComicNotification)
  NEW_COMICS: "NEW_COMICS",
} as const;

export type UnsubscribeChannel =
  (typeof UnsubscribeChannel)[keyof typeof UnsubscribeChannel];

// externalId is `user_<cuid2>` (alphanumeric + underscore) and the channel is
// uppercase letters, so a "." separator keeps the whole token URL-safe.
const SEPARATOR = ".";

export function createUnsubscribeToken(
  externalId: string,
  channel: UnsubscribeChannel
): string {
  return `${externalId}${SEPARATOR}${channel}`;
}

export function parseUnsubscribeToken(
  token: string | undefined | null
): { externalId: string; channel: UnsubscribeChannel } | null {
  if (!token) return null;

  const separatorIndex = token.lastIndexOf(SEPARATOR);
  if (separatorIndex <= 0) return null;

  const externalId = token.slice(0, separatorIndex);
  const channel = token.slice(separatorIndex + 1);

  if (!isUnsubscribeChannel(channel)) return null;

  return { externalId, channel };
}

function isUnsubscribeChannel(value: string): value is UnsubscribeChannel {
  return Object.prototype.hasOwnProperty.call(UnsubscribeChannel, value);
}

// Disable the given channel for the user the token points at. Returns whether a
// matching user was found; a missing/already-off user is treated as success so
// repeated one-click POSTs (mail clients retry) stay idempotent.
export async function applyUnsubscribe(token: string): Promise<boolean> {
  const parsed = parseUnsubscribeToken(token);
  if (!parsed) return false;

  const [user] = await getUserByExternalId(parsed.externalId);
  if (!user) return false;

  switch (parsed.channel) {
    case UnsubscribeChannel.NEW_SHOWS:
      await upsertShowNotification({ userId: user.id, enabled: false });
      return true;
    case UnsubscribeChannel.NEW_COMICS:
      await upsertNewComicNotification({ userId: user.id, enabled: false });
      return true;
    default:
      return false;
  }
}
