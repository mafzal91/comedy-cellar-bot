import { MANAGE_URL } from "./constants";

export function buildTextFooter(reason: string) {
  return `---
${reason}
Manage notification settings: ${MANAGE_URL}`;
}
