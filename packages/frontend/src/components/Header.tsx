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
      <header className="flex w-full items-center justify-between bg-brand px-5 py-4 sm:px-10">
        <a href="/" className="flex items-baseline">
          <span className="font-display text-d-md leading-none tracking-tightcap text-ink">
            COMEDY CELLAR
          </span>
          <span className="ml-2.5 font-mono text-eyebrow tracking-mega text-ink/60">
            EST. NYC 1981
          </span>
        </a>
        <nav className="flex items-center gap-x-6">
          {navLinks.map((item, itemIdx) => {
            const isLast = itemIdx === navLinks.length - 1;
            const isAuthAction = item.name === "Sign In" || item.name === "Sign out";

            if (isLast && isAuthAction) {
              return (
                <Link
                  key={itemIdx}
                  href={item.href}
                  variant="plain"
                  className="rounded-pill bg-ink px-4 py-2 font-sans text-sm font-bold text-brand hover:bg-ink/80"
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
                  "font-sans text-body font-medium text-ink opacity-[.78] hover:underline"
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
