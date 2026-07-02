import { getToday } from "../utils/date";
import { getClerk } from "../utils/clerk";
import { Link } from "../components/Link";
import { Perforation } from "./Perforation";
import { useEffect, useState } from "preact/hooks";
import clsx from "clsx";

const navigation = [
  { name: "Home", href: `/?date=${getToday()}` },
  { name: "Comics", href: "/comics" },
  { name: "Updates", href: "/updates" },
];

const signOutLink = [
  { name: "Profile", href: "/profile" },
  { name: "Sign out", href: "/sign-out" },
];
const signInLink = [{ name: "Sign In", href: "/sign-in" }];

export function Header() {
  const [navLinks, setNavLinks] = useState(navigation);

  useEffect(() => {
    getClerk().then((clerk) => {
      if (clerk.user) {
        setNavLinks([...navigation, ...signOutLink]);
      } else {
        setNavLinks([...navigation, ...signInLink]);
      }
    });
  }, []);

  return (
    <>
      <header className="flex w-full items-center justify-between bg-brand px-3 py-2.5 sm:px-10 sm:py-4">
        <a href="/" className="flex items-baseline">
          <span className="font-display text-d-sm leading-none tracking-tightcap text-ink sm:text-d-md">
            COMEDY CELLAR
          </span>
          <span className="ml-1.5 hidden font-mono text-eyebrow tracking-mega text-ink/60 sm:ml-2.5 sm:inline">
            EST. NYC 1981
          </span>
        </a>
        <nav className="flex items-center gap-x-2 sm:gap-x-6">
          {navLinks.map((item, itemIdx) => {
            const isLast = itemIdx === navLinks.length - 1;
            const isAuthAction = item.name === "Sign In" || item.name === "Sign out";

            if (isLast && isAuthAction) {
              return (
                <Link
                  key={itemIdx}
                  href={item.href}
                  variant="plain"
                  className="rounded-pill bg-ink px-3 py-2 font-sans text-xs font-bold text-brand hover:bg-ink/80 sm:px-4 sm:text-sm"
                >
                  {item.name}
                </Link>
              );
            }

            return (
              <Link
                key={itemIdx}
                href={item.href}
                variant="plain"
                className={clsx(
                  "font-sans font-medium text-ink opacity-[.78] hover:underline",
                  "text-[11px] sm:text-body"
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </header>
      <Perforation />
    </>
  );
}
