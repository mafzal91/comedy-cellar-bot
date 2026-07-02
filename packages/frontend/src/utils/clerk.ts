import type { Clerk } from "@clerk/clerk-js";

let clerkPromise: Promise<Clerk> | null = null;

export function getClerk(): Promise<Clerk> {
  clerkPromise ??= import("@clerk/clerk-js")
    .then(({ Clerk }) => {
      const instance = new Clerk(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
      return instance.load().then(() => instance);
    })
    .catch((error) => {
      // Don't cache a rejected promise — let the next caller retry.
      clerkPromise = null;
      throw error;
    });
  return clerkPromise;
}
