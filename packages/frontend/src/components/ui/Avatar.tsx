import clsx from "clsx";

/**
 * 6-pair avatar swatch rotation (bg/fg), theme-constant per plan/README.md:
 * "Comic/avatar swatch rotation: #F3C44C/#1A1714, #E7E0CF/#1A1714, #1A1714/#F3C44C,
 *  #E9C9A0/#1A1714, #D9CDB6/#1A1714, #2B2722/#FBF6EC (bg/fg pairs)"
 * Kept local to this file (src/utils/swatches.ts does not exist yet); if/when that
 * shared module lands, this component can switch to importing getSwatch/getInitials
 * from it without changing the public API below.
 */
const SWATCHES: { bg: string; fg: string }[] = [
  { bg: "#F3C44C", fg: "#1A1714" },
  { bg: "#E7E0CF", fg: "#1A1714" },
  { bg: "#1A1714", fg: "#F3C44C" },
  { bg: "#E9C9A0", fg: "#1A1714" },
  { bg: "#D9CDB6", fg: "#1A1714" },
  { bg: "#2B2722", fg: "#FBF6EC" },
];

function getSwatch(name: string): { bg: string; fg: string } {
  const key = name || "";
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % SWATCHES.length;
  return SWATCHES[index];
}

function getInitials(name: string): string {
  const words = (name || "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (words.length === 0) return "";
  return words.map((word) => word[0]!.toUpperCase()).join("");
}

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
          "group relative grid shrink-0 place-items-center overflow-hidden rounded-pill border-hair border-line",
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
        {/* Translucent placeholder overlay on hover */}
        <span
          aria-hidden="true"
          className="absolute inset-0 grid place-items-center font-display leading-none opacity-0 transition-opacity duration-150 group-hover:opacity-80"
          style={{ fontSize: size * 0.4, backgroundColor: bg, color: fg }}
        >
          {initials}
        </span>
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
