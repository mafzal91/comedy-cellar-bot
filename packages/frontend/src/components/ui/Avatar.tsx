import clsx from "clsx";
import { getInitials, getSwatch } from "../../utils/swatches";

export interface AvatarProps {
  name: string;
  img?: string;
  size?: number;
  className?: string;
}

export function Avatar({ name, img, size = 42, className }: AvatarProps) {
  const { bg, fg } = getSwatch(name);
  const initials = getInitials(name);

  if (img) {
    return (
      <span
        className={clsx(
          "grid shrink-0 place-items-center overflow-hidden rounded-pill border-hair border-line",
          className,
        )}
        style={{ width: size, height: size }}
      >
        <img
          src={img}
          alt={`${name}'s photo`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={clsx(
        "grid place-items-center shrink-0 rounded-pill border-hair border-line font-display leading-none",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        backgroundColor: bg,
        color: fg,
      }}
    >
      {initials}
    </span>
  );
}
