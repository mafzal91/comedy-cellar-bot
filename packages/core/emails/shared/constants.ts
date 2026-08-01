// Plain constants shared by the react-email templates in packages/core/emails.
// Pure module: no db/sst imports, so it can be rendered and previewed
// offline just like the templates that use it.

export const TIME_ZONE = "America/New_York";
export const SITE_URL = "https://comedycellar.mafz.al";
export const RESERVATION_URL = `${SITE_URL}/reservations/`;
export const MANAGE_URL = `${SITE_URL}/profile`;

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
