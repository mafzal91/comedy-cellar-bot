import { PageLoader } from "../../components/PageLoader";
import { clerk } from "../../utils/clerk";
import PageWrapper from "../Auth/PageWrapper";
import { useEffect, useRef } from "preact/hooks";

export default function Profile() {
  const profileRef = useRef();
  useEffect(() => {
    clerk.load().then(() => {
      clerk.mountUserProfile(profileRef.current);
    });
  }, []);

  return (
    <PageWrapper>
      <div ref={profileRef} />
    </PageWrapper>
  );
}
