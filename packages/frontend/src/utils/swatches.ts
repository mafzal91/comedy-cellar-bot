/**
 * Avatar swatch rotation — "vintage marquee" palette.
 *
 * 6 bg/fg pairs (theme-constant — same in light and dark) used to color
 * initials-based avatar placeholders (comics, users) throughout the app.
 * See plan/README.md "Comic/avatar swatch rotation" and
 * src/components/ui/CONTRACT.md.
 */

export const SWATCHES: { bg: string; fg: string }[] = [
  { bg: "#F3C44C", fg: "#1A1714" },
  { bg: "#E7E0CF", fg: "#1A1714" },
  { bg: "#1A1714", fg: "#F3C44C" },
  { bg: "#E9C9A0", fg: "#1A1714" },
  { bg: "#D9CDB6", fg: "#1A1714" },
  { bg: "#2B2722", fg: "#FBF6EC" },
];

/**
 * Deterministically maps a name to one of the SWATCHES pairs by summing
 * char codes and taking the result modulo the number of swatches. Falls
 * back to the first swatch for an empty/undefined name.
 */
export function getSwatch(name: string): { bg: string; fg: string } {
  if (!name) {
    return SWATCHES[0];
  }

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash += name.charCodeAt(i);
  }

  return SWATCHES[hash % SWATCHES.length];
}

/**
 * Returns up to two uppercase initials from the first two
 * whitespace-separated words of a name. Empty/undefined name -> "".
 */
export function getInitials(name: string): string {
  if (!name) {
    return "";
  }

  const words = name.trim().split(/\s+/).filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}
