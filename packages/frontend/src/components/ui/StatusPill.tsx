import {
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  XCircleIcon,
} from "@heroicons/react/20/solid";

import { Badge, type BadgeIcon, type BadgeTone } from "./Badge";

export type StatusPillStatus =
  | "available"
  | "selling-fast"
  | "sold-out"
  | "ended";

type StatusPillProps = {
  status?: StatusPillStatus;
  /** Render a leading status icon (e.g. for the icon-only compact/mobile badge). */
  withIcon?: boolean;
  className?: string;
};

const STATUS_CONFIG: Record<
  StatusPillStatus,
  { label: string; tone: BadgeTone; Icon: BadgeIcon }
> = {
  available: { label: "Available", tone: "success", Icon: CheckCircleIcon },
  "selling-fast": { label: "Selling Fast", tone: "warning", Icon: FireIcon },
  "sold-out": { label: "Sold Out", tone: "danger", Icon: XCircleIcon },
  ended: { label: "Show Ended", tone: "neutral", Icon: ClockIcon },
};

/**
 * Availability chip for a show, colored by status. A thin domain wrapper over
 * the shared {@link Badge} primitive. Pass `withIcon` to prepend the status
 * glyph — used by the mobile compact badge where the seats bar is hidden.
 */
export function StatusPill({
  status = "available",
  withIcon = false,
  className,
}: StatusPillProps) {
  const { label, tone, Icon } = STATUS_CONFIG[status];

  return (
    <Badge tone={tone} icon={withIcon ? Icon : undefined} className={className}>
      {label}
    </Badge>
  );
}
