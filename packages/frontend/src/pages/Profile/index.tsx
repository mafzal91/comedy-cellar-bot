import { useEffect, useRef } from "preact/hooks";

import PageWrapper from "../Auth/PageWrapper";
import { Spinner } from "../../components/Spinner";
import { clerk } from "../../utils/clerk";
import { fetchSettings } from "../../utils/api";
import { useQuery } from "@tanstack/react-query";

export default function Profile() {
  const profileRef = useRef();
  useEffect(() => {
    clerk.load().then(() => {
      clerk.mountUserProfile(profileRef.current);
    });
  }, []);

  return (
    <PageWrapper>
      <div className="flex flex-col">
        <div ref={profileRef} />
      </div>
    </PageWrapper>
  );
}
