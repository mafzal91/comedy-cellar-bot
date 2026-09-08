import { Card, CardBody, CardHeader } from "@/components/Card";
import { ComicNotification, Settings } from "@/types";
import { fetchSettings, updateSettings } from "@/utils/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "preact/hooks";

import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Link } from "@/components/Link";
import { PageLoader } from "@/components/PageLoader";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import {
  BellAlertIcon,
  BellSlashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";

// The cadence is stored as an arbitrary interval in minutes (0 = immediately);
// the UI only exposes these curated presets so users pick a friendly label.
// This list is a hand-kept copy of FREQUENCY_PRESETS in
// packages/core/common/notificationFrequency.ts (the frontend can't import
// @core). The API validates against the core copy, so a new preset must be
// added in BOTH places or the API will reject the new value with a 400.
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

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="flex flex-col gap-[22px]">
      {data ? (
        <GlobalNotifications settings={data} save={updateSettings} />
      ) : (
        <Card>
          <CardBody>
            <p className="font-sans text-caption text-muted">
              We couldn't load your notification settings just now. Refresh the
              page to try again.
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
            We'll email you when a comic you follow is booked on a show with
            open seats. Manage each comic from its profile page.
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
  nonImmediateWarning,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  // Optional caution shown only when a slower-than-immediate cadence is picked.
  nonImmediateWarning?: string;
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
      {nonImmediateWarning && selected !== 0 && (
        <p className="flex items-start gap-2 rounded-field border-hair border-warning bg-warning-soft px-3 py-2 font-sans text-caption text-warning">
          <ExclamationTriangleIcon className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{nonImmediateWarning}</span>
        </p>
      )}
    </div>
  );
}

export type GlobalNotificationsBody = {
  showNotification: { enabled: boolean; frequencyMinutes: number };
  newComicNotification: { enabled: boolean; frequencyMinutes: number };
};

// The "Global Notifications" form. `save` is injected so the same form can be
// backed by the signed-in /api/settings route (profile page) or the
// token-authorized /api/alerts/settings route (the email "manage" link).
export function GlobalNotifications({
  settings,
  save,
}: {
  settings: Settings;
  save: (body: GlobalNotificationsBody) => Promise<unknown>;
}) {
  const {
    mutate: mutateSettings,
    isPending,
    isSuccess,
    isError,
    reset,
  } = useMutation({
    mutationFn: save,
  });

  // Let the "Saved" confirmation fade after a moment so a second edit reads
  // as a fresh, unsaved change.
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(reset, 3000);
    return () => clearTimeout(timer);
  }, [isSuccess, reset]);

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
              nonImmediateWarning="Heads-up: with a weekly or monthly digest, a show added between emails can sell out or happen before you hear about it. Choose Immediately if you don't want to miss short-notice shows."
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
          <div className="flex items-center justify-end gap-3">
            {isSuccess && (
              <span className="font-mono text-[11px] uppercase tracking-cap text-success">
                Saved
              </span>
            )}
            {isError && (
              <span className="font-mono text-[11px] uppercase tracking-cap text-warning">
                Couldn't save — try again
              </span>
            )}
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
  onToggle,
}: {
  comicNotifications?: ComicNotification[];
  // When provided, each row gets a Mute/Unmute button instead of a static pill
  // (used by the no-login settings page, where the comic profile page's toggle
  // isn't available).
  onToggle?: (comicId: string, enabled: boolean) => void;
}) {
  const list = comicNotifications ?? [];

  if (!list.length) {
    return (
      <p className="font-sans text-caption text-muted">
        You aren't following any comics yet.
      </p>
    );
  }

  return (
    <ul role="list" className="flex flex-col divide-y divide-track">
      {list.map((comicNotification) => (
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
          <div className="flex shrink-0 items-center gap-2">
            <NotificationPill enabled={comicNotification.enabled} />
            {onToggle && (
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() =>
                  onToggle(comicNotification.comicId, !comicNotification.enabled)
                }
              >
                {comicNotification.enabled ? "Mute" : "Unmute"}
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
