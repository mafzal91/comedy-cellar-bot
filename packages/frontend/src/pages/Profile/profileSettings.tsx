import { Card, CardBody, CardHeader } from "@/components/Card";
import { ComicNotification, Settings } from "@/types";
import { fetchSettings, updateSettings } from "@/utils/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "preact/hooks";

import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Link } from "@/components/Link";
import { PageLoader } from "@/components/PageLoader";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { BellAlertIcon, BellSlashIcon } from "@heroicons/react/20/solid";

// The cadence is stored as an arbitrary interval in minutes (0 = immediately);
// the UI only exposes these curated presets so users pick a friendly label.
// Add a row here to offer another preset — no backend change needed.
const MINUTES_PER_DAY = 24 * 60;
const FREQUENCY_OPTIONS: { label: string; value: number }[] = [
  { label: "Immediately", value: 0 },
  { label: "Weekly", value: 7 * MINUTES_PER_DAY },
  { label: "Monthly", value: 30 * MINUTES_PER_DAY },
];
const DEFAULT_FREQUENCY_MINUTES = 0;

export function ProfileSettings() {
  const { data, isLoading } = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  if (isLoading || !data) {
    return <PageLoader />;
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <GlobalNotifications settings={data} />

      <Card>
        <CardHeader>
          <h3 className="font-display text-d-sm tracking-cap text-text">
            Comic Notifications (coming soon)
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

// A cadence picker is only meaningful for an alert that is turned on, so it is
// shown right under its toggle and hidden when the alert is off.
function FrequencyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  // Snap an arbitrary stored interval to the nearest preset so a value set
  // outside the UI still highlights a sensible option instead of nothing.
  const selected = FREQUENCY_OPTIONS.some((option) => option.value === value)
    ? value
    : FREQUENCY_OPTIONS.reduce((closest, option) =>
        Math.abs(option.value - value) < Math.abs(closest.value - value)
          ? option
          : closest
      ).value;

  return (
    <div className="flex flex-col gap-2 pl-8">
      <span className="font-mono text-[11px] uppercase tracking-cap text-faint">
        {label}
      </span>
      <SegmentedToggle<number>
        options={FREQUENCY_OPTIONS}
        value={selected}
        onChange={onChange}
      />
    </div>
  );
}

function GlobalNotifications({ settings }: { settings: Settings }) {
  const { mutate: mutateSettings, isPending } = useMutation({
    mutationFn: updateSettings,
  });

  const [showEnabled, setShowEnabled] = useState(
    settings.showNotification.enabled ?? false
  );
  const [showFrequency, setShowFrequency] = useState<number>(
    settings.showNotification.frequencyMinutes ?? DEFAULT_FREQUENCY_MINUTES
  );
  const [comicEnabled, setComicEnabled] = useState(
    settings.newComicNotification?.enabled ?? false
  );
  const [comicFrequency, setComicFrequency] = useState<number>(
    settings.newComicNotification?.frequencyMinutes ??
      DEFAULT_FREQUENCY_MINUTES
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    mutateSettings({
      showNotification: {
        enabled: showEnabled,
        frequencyMinutes: showFrequency,
      },
      newComicNotification: {
        enabled: comicEnabled,
        frequencyMinutes: comicFrequency,
      },
    });
  };

  return (
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
            checked={showEnabled}
            onChange={setShowEnabled}
          />
          {showEnabled && (
            <FrequencyField
              label="How often"
              value={showFrequency}
              onChange={setShowFrequency}
            />
          )}
          <Checkbox
            label="newComicNotification"
            displayLabel="New Comic Alerts"
            description="Get an email when a comic new to the Comedy Cellar joins the lineup for the first time."
            checked={comicEnabled}
            onChange={setComicEnabled}
          />
          {comicEnabled && (
            <FrequencyField
              label="How often"
              value={comicFrequency}
              onChange={setComicFrequency}
            />
          )}
          <div className="flex justify-end">
            <Button type="submit" variant="solid" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
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
