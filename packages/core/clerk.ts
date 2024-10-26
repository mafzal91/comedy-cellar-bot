import { Resource } from "sst";
import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: Resource.ClerkSecretKey.value,
});

export { clerkClient };
