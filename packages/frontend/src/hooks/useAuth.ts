import { useEffect, useState } from "preact/hooks";
import { UserResource } from "@clerk/types";
import { getClerk } from "../utils/clerk";

export function useAuth() {
  const [user, setUser] = useState<UserResource | null>(null);

  useEffect(() => {
    getClerk().then((clerk) => {
      if (clerk.user) {
        setUser(clerk.user);
      } else {
        setUser(null);
      }
    });
  }, []);

  return user;
}
