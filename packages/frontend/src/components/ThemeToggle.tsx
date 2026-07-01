import { FunctionalComponent } from "preact";

import clsx from "clsx";

import { useTheme } from "../hooks/useTheme";

type ThemeToggleProps = {
  className?: string;
};

export const ThemeToggle: FunctionalComponent<ThemeToggleProps> = ({ className }) => {
  const { theme, toggle } = useTheme();

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={clsx(
        "fixed bottom-6 right-6 z-50",
        "grid h-11 w-11 place-items-center",
        "bg-surface border-hair border-line rounded-pill shadow-block",
        "hover:bg-brand hover:text-brand-fg transition",
        className,
      )}
    >
      <span aria-hidden="true">{isDark ? "☾" : "☀"}</span>
    </button>
  );
};
