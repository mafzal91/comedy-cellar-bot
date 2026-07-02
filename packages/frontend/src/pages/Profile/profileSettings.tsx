import { Card, CardBody, CardHeader } from "@/components/Card";
import { ComicNotification, Settings } from "@/types";
import { fetchSettings, updateSettings } from "@/utils/api";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Link } from "@/components/Link";
import { PageLoader } from "@/components/PageLoader";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { BellAlertIcon, BellSlashIcon } from "@heroicons/react/20/solid";

export function ProfileSettings() {
  const { data, isLoading } = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const { mutate: mutateSettings, isPending } = useMutation({
    mutationFn: updateSettings,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const showNotification = formData.get("showNotification") === "on";

    mutateSettings({ showNotification: { enabled: showNotification } });
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <Card>
        <CardHeader>
          <h3 className="font-display text-d-sm tracking-cap text-text">
            Global Notifications
          </h3>
          <p className="mt-1 font-mono text-[11px] text-faint">
            System-wide setting
          </p>
        </CardHeader>
        <CardBody>
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <Checkbox
              label="showNotification"
              displayLabel="New Show Alerts"
              description="Get a heads-up whenever any new show is added — independent of comic notifications."
              defaultChecked={data?.showNotification.enabled ?? false}
            />
            <div className="flex justify-end">
              <Button type="submit" variant="solid" disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-display text-d-sm tracking-cap text-text">
            Comic Notifications
          </h3>
          <p className="mt-1 font-sans text-caption text-muted">
            You'll be notified when a tracked comic is added to a show. Manage
            each comic from its profile page.
          </p>
        </CardHeader>
        <CardBody>
          <ComicNotificationList comicNotifications={data?.comicNotifications} />
        </CardBody>
      </Card>
    </div>
  );
}

function NotificationPill({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <Badge tone="success" icon={BellAlertIcon}>
      Enabled
    </Badge>
  ) : (
    <Badge tone="muted" icon={BellSlashIcon}>
      Muted
    </Badge>
  );
}

export function ComicNotificationList({
  comicNotifications,
}: {
  comicNotifications?: ComicNotification[];
}) {
  return (
    <ul role="list" className="flex flex-col divide-y divide-track">
      {(comicNotifications ?? []).map((comicNotification) => (
        <li
          key={comicNotification.comicId}
          className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
        >
          <div className="flex min-w-0 items-center gap-3.5">
            <Avatar name={comicNotification.name} img={comicNotification.comic} size={42} />
            <Link
              href={`/comics/${comicNotification.comicId}`}
              className="truncate text-body font-bold text-text"
            >
              {comicNotification.name}
            </Link>
          </div>
          <NotificationPill enabled={comicNotification.enabled} />
        </li>
      ))}
    </ul>
  );
}
