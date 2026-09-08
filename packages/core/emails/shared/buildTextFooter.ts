import { MANAGE_URL } from "./constants";

export function buildTextFooter(
  reason: string,
  unsubscribeUrl?: string,
  // Personalized no-login settings link; falls back to the profile page.
  manageUrl: string = MANAGE_URL
) {
  const lines = ["---", reason, `Manage notification settings: ${manageUrl}`];
  if (unsubscribeUrl) {
    lines.push(`Unsubscribe: ${unsubscribeUrl}`);
  }
  return lines.join("\n");
}
