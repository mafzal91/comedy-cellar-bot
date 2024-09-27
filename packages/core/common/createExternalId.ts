import { createId } from "@paralleldrive/cuid2";

export function createExternalId(prefix?: string) {
  if (prefix) {
    return `${prefix}_${createId()}`;
  }

  return createId();
}
