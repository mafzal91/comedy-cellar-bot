import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "preact-iso";

import { Card, CardBody, CardHeader } from "@/components/Card";
import { Link } from "@/components/Link";
import { PageLoader } from "@/components/PageLoader";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PageHeader } from "@/components/ui/PageHeader";
import { AlertSettings } from "@/types";
import {
  AlertsApiError,
  fetchAlertSettings,
  updateAlertSettings,
} from "@/utils/api";

import {
  ComicNotificationList,
  GlobalNotifications,
} from "../Profile/profileSettings";

// /alerts/:token — the landing page for the "manage your notification
// settings" link in every subscriber email. A slimmed-down profile page with
// nothing but the email preferences, authorized by the signed token in the URL
// (no sign-in needed). Backed by GET/POST /api/alerts/settings.

export default function Alerts() {
  const { params } = useRoute();
  const token = params.token ?? "";
  const queryClient = useQueryClient();
  const queryKey = ["alerts", token];

  const { data, isLoading, error } = useQuery<AlertSettings, Error>({
    queryKey,
    queryFn: () => fetchAlertSettings(token),
    enabled: Boolean(token),
    retry: false,
  });

  // Comic follows are toggled row-by-row and saved immediately.
  const { mutate: toggleComic, isPending: isTogglingComic } = useMutation({
    mutationFn: ({ comicId, enabled }: { comicId: string; enabled: boolean }) =>
      updateAlertSettings({
        token,
        comicNotifications: [{ comicId, enabled }],
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  if (!token || (error && error instanceof AlertsApiError)) {
    return <InvalidLink code={(error as AlertsApiError | null)?.code} />;
  }

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="mx-auto w-full max-w-225 pb-16">
      <PageHeader
        eyebrow="Email Preferences"
        title="Manage Your Notifications"
        subline={
          data ? (
            <>
              Settings for <span className="text-text">{data.email}</span>. No
              sign-in needed — changes save straight from this page.
            </>
          ) : undefined
        }
        className="mb-7"
      />

      <div className="flex flex-col gap-[22px]">
        {data ? (
          <GlobalNotifications
            settings={data}
            save={(body) => updateAlertSettings({ token, ...body })}
          />
        ) : (
          <Card>
            <CardBody>
              <p className="font-sans text-caption text-muted">
                We couldn't load your notification settings just now. Refresh
                the page to try again.
              </p>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader>
            <h3 className="font-display text-d-sm tracking-cap text-text">
              Comic Notifications
            </h3>
            <p className="mt-1 font-sans text-caption text-muted">
              We email you when a comic you follow is booked on a show with
              open seats. Mute any you no longer want to hear about.
            </p>
          </CardHeader>
          <CardBody>
            <div className={isTogglingComic ? "opacity-60" : undefined}>
              <ComicNotificationList
                comicNotifications={data?.comicNotifications}
                onToggle={(comicId, enabled) =>
                  toggleComic({ comicId, enabled })
                }
              />
            </div>
          </CardBody>
        </Card>

        <p className="text-center font-mono text-meta uppercase tracking-wider text-faint">
          Want to change anything else?{" "}
          <Link href="/profile" variant="plain" className="text-muted underline">
            Sign in to your profile
          </Link>
        </p>
      </div>
    </div>
  );
}

function InvalidLink({ code }: { code?: string }) {
  const expired = code === "expired";
  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6">
      <div className="flex flex-col items-center text-center">
        <Eyebrow>{expired ? "Link expired" : "Invalid link"}</Eyebrow>
        <h1 className="mt-2 font-display text-d-lg leading-none tracking-tightcap text-text sm:text-d-xl">
          {expired ? "This link has expired" : "We can't read that link"}
        </h1>
        <p className="mt-4 max-w-md font-sans text-body leading-relaxed text-muted">
          {expired
            ? "Settings links in our emails only work for a limited time. Use the link from a more recent email, or sign in to manage your notifications."
            : "That settings link looks incomplete or has been altered. Use the link from one of our emails, or sign in to manage your notifications."}
        </p>
        <div className="mt-8">
          <Link href="/profile" variant="underline">
            Sign in to manage notifications
          </Link>
        </div>
      </div>
    </div>
  );
}
