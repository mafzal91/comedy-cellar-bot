import { ProfileTabContent, ProfileTabs } from "./profileTabs";
import { useEffect, useRef } from "preact/hooks";

import PageWrapper from "../Auth/PageWrapper";
import { ProfileSettings } from "./profileSettings";
import { clerk } from "../../utils/clerk";

enum ProfileTabName {
  Settings = "Settings",
  Profile = "Profile",
}

export default function Profile() {
  const profileRef = useRef();
  useEffect(() => {
    clerk.load().then(() => {
      clerk.mountUserProfile(profileRef.current);
    });
  }, []);

  return (
    <PageWrapper>
      <div className="flex flex-col w-full">
        <ProfileTabs>
          <ProfileTabContent tabName={ProfileTabName.Settings}>
            <ProfileSettings />
          </ProfileTabContent>

          <ProfileTabContent tabName={ProfileTabName.Profile}>
            <div className="flex justify-center">
              <div ref={profileRef} />
            </div>
          </ProfileTabContent>
        </ProfileTabs>
      </div>
    </PageWrapper>
  );
}
