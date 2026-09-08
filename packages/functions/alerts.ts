import qs from "qs";

import { generateResponse } from "@core/common/generateResponse";
import { verifyAlertsToken } from "@core/alertsToken";
import { getUserByExternalId } from "@core/models/user";
import {
  applyNotificationSettings,
  notificationSettingsUpdateSchema,
  readNotificationSettings,
} from "@core/notificationSettings";

// Token-authorized notification settings — the API behind the "manage your
// notification settings" link in every subscriber email. No Clerk session
// required; the signed token in the URL is the credential (see
// packages/core/alertsToken.ts).
//
//   GET  /api/alerts/settings?token=...  -> current prefs + a masked email so
//        the page can say whose settings these are. Mutates nothing, so link
//        scanners/prefetchers can't change anything.
//   POST /api/alerts/settings?token=...  -> same body as POST /api/settings.

function respond(statusCode: number, body: Record<string, any> | string) {
  return generateResponse({ statusCode, body });
}

function tokenFromEvent(evt: any): string | undefined {
  const query = qs.parse(evt.rawQueryString ?? "");
  return typeof query.token === "string" && query.token ? query.token : undefined;
}

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

// Resolve the token to a user, or to the error response to send back.
async function resolveUser(evt: any) {
  const verified = verifyAlertsToken(tokenFromEvent(evt));
  if (verified.ok === false) {
    return {
      user: null,
      response: respond(401, { error: verified.error }),
    } as const;
  }

  const [user] = await getUserByExternalId(verified.claims.externalId);
  if (!user) {
    return {
      user: null,
      response: respond(404, { error: "user not found" }),
    } as const;
  }

  return { user, response: null, expiresAt: verified.claims.expiresAt } as const;
}

export async function get(evt: any) {
  const resolved = await resolveUser(evt);
  if (!resolved.user) return resolved.response;

  const settings = await readNotificationSettings(resolved.user.id);

  return respond(200, {
    ...settings,
    email: maskEmail(resolved.user.email),
    expiresAt: resolved.expiresAt.toISOString(),
  });
}

export async function update(evt: any) {
  const resolved = await resolveUser(evt);
  if (!resolved.user) return resolved.response;

  let postBody: unknown;
  try {
    postBody = JSON.parse(evt.body ?? "{}");
  } catch {
    return respond(400, { error: "invalid JSON body" });
  }

  const body = notificationSettingsUpdateSchema.safeParse(postBody);
  if (!body.success) {
    return respond(400, body.error.format());
  }

  await applyNotificationSettings(resolved.user.id, body.data);

  return respond(200, { ok: "ok" });
}
