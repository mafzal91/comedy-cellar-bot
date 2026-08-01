import { MANAGE_URL } from "./constants";

export function buildTextFooter(reason: string, unsubscribeUrl?: string) {
  const lines = [
    "---",
    reason,
    `Manage notification settings: ${MANAGE_URL}`,
  ];
  if (unsubscribeUrl) {
    lines.push(`Unsubscribe: ${unsubscribeUrl}`);
  }
  return lines.join("\n");
}
