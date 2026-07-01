import { useEffect, useState } from "preact/hooks";

export type Theme = "light" | "dark";

const STORAGE_KEY = "cc-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  const domTheme = document.documentElement.dataset.theme;
  if (domTheme === "light" || domTheme === "dark") {
    return domTheme;
  }

  return "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.documentElement.setAttribute("data-theme", theme);
    // Sync on mount only; toggle() handles subsequent updates itself.
    // eslint-disable-next-line preact-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    setTheme((current) => {
      const next: Theme = current === "light" ? "dark" : "light";

      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", next);
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next);
      }

      return next;
    });
  };

  return { theme, toggle };
}
