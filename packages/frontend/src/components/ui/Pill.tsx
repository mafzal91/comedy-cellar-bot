import clsx from "clsx";

type PillProps = {
  className?: string;
  children?: React.ReactNode;
};

/**
 * Generic small pill chip — mono, uppercase, hairline border.
 * Composable: pass `className` to recolor (e.g. a yellow "New" badge)
 * or otherwise override the defaults.
 */
export function Pill({ className, children }: PillProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center font-mono uppercase text-meta tracking-wider rounded-pill border-hair border-line px-2.5 py-1 text-text",
        className,
      )}
    >
      {children}
    </span>
  );
}
