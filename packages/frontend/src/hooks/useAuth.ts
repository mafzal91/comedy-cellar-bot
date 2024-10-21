import { useEffect, useState } from "preact/hooks";
import { UserResource } from "@clerk/types";
import { clerk } from "../utils/clerk";

export function useAuth() {
  const [user, setUser] = useState<UserResource | null>(null);

  useEffect(() => {
    clerk.load().then(() => {
      if (clerk.user) {
        setUser(clerk.user);
      } else {
        setUser(null);
      }
    });
  }, []);

  return user;
}
