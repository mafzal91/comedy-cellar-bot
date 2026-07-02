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
        "bg-surface border-hair border-line rounded-pill shadow-block text-text",
        "hover:bg-brand hover:text-brand-fg transition",
        className,
      )}
    >
      {isDark ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="currentColor"
        >
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )}
    </button>
  );
};
