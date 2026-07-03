import { ProfileTabContent, ProfileTabs } from "./profileTabs";
import { useEffect, useRef } from "preact/hooks";

import PageWrapper from "../Auth/PageWrapper";
import { ProfileSettings } from "./profileSettings";
import { getClerk } from "../../utils/clerk";
import { authAppearance } from "../Auth/authAppearance";

import { Card, CardBody, CardHeader } from "../../components/Card";
import { Eyebrow } from "../../components/ui/Eyebrow";
import { PageHeader } from "../../components/ui/PageHeader";

enum ProfileTabName {
  Settings = "Settings",
  Profile = "Profile",
}

export default function Profile() {
  const profileRef = useRef();
  useEffect(() => {
    getClerk().then((clerk) => {
      clerk.mountUserProfile(profileRef.current, {
        appearance: authAppearance,
      });
    });
  }, []);

  return (
    <PageWrapper>
      <div className="w-full max-w-225 pb-16">
        <PageHeader
          eyebrow="Your Account"
          title="Backstage Pass"
          className="mb-7"
        />

        <ProfileTabs>
          <ProfileTabContent tabName={ProfileTabName.Settings}>
            <ProfileSettings />
          </ProfileTabContent>

          <ProfileTabContent tabName={ProfileTabName.Profile}>
            <Card>
              <CardHeader>
                <Eyebrow>Account</Eyebrow>
                <h3 className="mt-1 font-display text-d-sm tracking-cap text-text">
                  Your Details
                </h3>
              </CardHeader>
              <CardBody>
                <div className="flex justify-center">
                  <div ref={profileRef} />
                </div>
              </CardBody>
            </Card>
          </ProfileTabContent>
        </ProfileTabs>
      </div>
    </PageWrapper>
  );
}
