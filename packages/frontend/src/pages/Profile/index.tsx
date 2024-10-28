import { useQuery } from "react-query";
import { useEffect, useRef } from "preact/hooks";
import { clerk } from "../../utils/clerk";

import { Spinner } from "../../components/Spinner";
import PageWrapper from "../Auth/PageWrapper";
import { fetchSettings } from "../../utils/api";

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
