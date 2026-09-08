// Plain constants shared by the react-email templates in packages/core/emails.
// Pure module: no db/sst imports, so it can be rendered and previewed
// offline just like the templates that use it.

export const TIME_ZONE = "America/New_York";
export const SITE_URL = "https://comedycellar.mafz.al";
export const RESERVATION_URL = `${SITE_URL}/reservations/`;
// Generic fallback (requires sign-in). Emails prefer the per-recipient
// `manageUrl(token)` below, which opens the settings page WITHOUT a login.
export const MANAGE_URL = `${SITE_URL}/profile`;

// Build the personalized, no-login "manage your notification settings" URL
// for a signed alerts token (see packages/core/alertsToken.ts). Lands on the
// SPA route /alerts/:token, which reads and writes prefs via
// /api/alerts/settings.
export function manageUrl(token: string) {
  return `${SITE_URL}/alerts/${encodeURIComponent(token)}`;
}

// The unsubscribe endpoint lives on the API gateway, not the static site.
export const API_URL = "https://comedycellar-api.mafz.al";

// Build the personalized unsubscribe URL for an opaque per-user token
// (see packages/core/unsubscribe.ts). Points at the GET landing page, which is
// the human-facing link and is also what mail clients render.
export function unsubscribeUrl(token: string) {
  return `${API_URL}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}

// Brand tokens borrowed from packages/frontend/src/theme.css
export const COLOR = {
  bg: "#FBF6EC",
  surface: "#FFFFFF",
  ink: "#1A1714",
  muted: "#857B6D",
  faint: "#A99F8E",
  track: "#EDE7DA",
  yellow: "#F3C44C",
};

export const SERIF = "Georgia, 'Times New Roman', serif";
export const SANS = "Arial, Helvetica, sans-serif";
