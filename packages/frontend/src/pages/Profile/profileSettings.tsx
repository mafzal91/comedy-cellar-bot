import { Card, CardBody, CardHeader } from "../../components/Card";
import { ComicNotification, Settings } from "../../types";
import { fetchSettings, updateSettings } from "../../utils/api";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import { Link } from "../../components/Link";
import { PageLoader } from "../../components/PageLoader";
import { Spinner } from "../../components/Spinner";

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
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <h3 className="text-base font-semibold text-gray-900">
            Global Notifications
          </h3>
          <p className="mt-1 text-sm text-gray-500">System setting below</p>
        </CardHeader>
        <CardBody>
          <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <Checkbox
              label="showNotification"
              displayLabel="Show Notification"
              description="Get whenever any new shows are added (this is independent of comic notifications)"
              defaultChecked={data?.showNotification.enabled ?? false}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-base font-semibold text-gray-900">
            Comic Notifications
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            You'll be notified when a comic is assigned to a show.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            You can disable notifications for by going to the comic's profile
            page.
          </p>
        </CardHeader>
        <CardBody>
          <ComicNotificationList
            comicNotifications={data?.comicNotifications}
          />
        </CardBody>
      </Card>
    </div>
  );
}

export function Badge({ enabled }: { enabled: boolean }) {
  const color = enabled
    ? "bg-green-50 text-green-700 ring-green-600/20"
    : "bg-red-50 text-red-700 ring-red-600/20";
  return (
    <span
      className={`inline-flex items-center rounded-md ${color} px-2 py-1 text-xs font-medium ring-1 ring-inset`}
    >
      {enabled ? "Enabled" : "Disabled"}
    </span>
  );
}

export function ComicNotificationList({
  comicNotifications,
}: {
  comicNotifications: ComicNotification[];
}) {
  return (
    <ul role="list" className="flex flex-col divide-y divide-gray-100 pad-y-5">
      {comicNotifications.map((comicNotification) => (
        <li
          key={comicNotification.comicId}
          className="flex justify-between gap-x-6"
        >
          <div className="flex min-w-0 gap-x-4">
            <img
              alt={`${comicNotification.name} comic image`}
              src={comicNotification.comic}
              className="size-12 flex-none rounded-full bg-gray-50"
            />
            <div className="min-w-0 flex-auto">
              <Link
                href={`/comics/${comicNotification.comicId}`}
                className="text-sm/6 font-semibold text-gray-900"
              >
                {comicNotification.name}
              </Link>
            </div>
          </div>
          <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
            <p className="text-sm/6 text-gray-900">
              <Badge enabled={comicNotification.enabled} />
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
