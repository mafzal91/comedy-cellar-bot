import { createHmac, timingSafeEqual } from "node:crypto";
import { Resource } from "sst";

// Signed, expiring "manage your notification settings" links.
//
// Every subscriber email carries a link to `${SITE}/alerts/<token>`. The token
// is the capability: it identifies the recipient (by `externalId`) and expires,
// and it's HMAC-signed with the AlertsTokenSecret so nobody can mint one for
// another user. The page it opens lets the recipient read and change their
// email notification preferences WITHOUT signing in — the whole point is that
// someone who no longer wants email shouldn't need their password to say so.
//
// Format: `<base64url(json payload)>.<base64url(hmac-sha256)>`
//   payload = { v: 1, sub: "user_…", exp: <unix seconds> }
//
// Blast radius of a leaked/forwarded link: whoever holds it can view and toggle
// that one user's notification prefs (no email address, no account access)
// until it expires. That's the same trade-off every "manage preferences" email
// link makes; the expiry bounds it.

export const ALERTS_TOKEN_TTL_DAYS = 30;

const VERSION = 1;

type Payload = {
  v: number;
  sub: string;
  exp: number;
};

export type AlertsTokenClaims = {
  externalId: string;
  expiresAt: Date;
};

export type AlertsTokenError = "malformed" | "bad_signature" | "expired";

function secret(): string {
  // Read lazily so modules that merely import this file (e.g. the email
  // templates' callers) don't crash at load time in Lambdas without the link.
  const value = Resource.AlertsTokenSecret.value;
  if (!value) throw new Error("AlertsTokenSecret is not set");
  return value;
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", secret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createAlertsToken(
  externalId: string,
  {
    now = new Date(),
    ttlDays = ALERTS_TOKEN_TTL_DAYS,
  }: { now?: Date; ttlDays?: number } = {}
): string {
  const payload: Payload = {
    v: VERSION,
    sub: externalId,
    exp: Math.floor(now.getTime() / 1000) + ttlDays * 24 * 60 * 60,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyAlertsToken(
  token: string | undefined | null,
  now = new Date()
): { ok: true; claims: AlertsTokenClaims } | { ok: false; error: AlertsTokenError } {
  if (!token || typeof token !== "string") return { ok: false, error: "malformed" };

  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) {
    return { ok: false, error: "malformed" };
  }
  const encoded = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);

  // Constant-time compare; lengths must match for timingSafeEqual.
  const expectedSig = sign(encoded);
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, error: "bad_signature" };
  }

  let payload: Payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return { ok: false, error: "malformed" };
  }

  if (
    !payload ||
    payload.v !== VERSION ||
    typeof payload.sub !== "string" ||
    !payload.sub ||
    typeof payload.exp !== "number"
  ) {
    return { ok: false, error: "malformed" };
  }

  if (payload.exp * 1000 <= now.getTime()) {
    return { ok: false, error: "expired" };
  }

  return {
    ok: true,
    claims: { externalId: payload.sub, expiresAt: new Date(payload.exp * 1000) },
  };
}
