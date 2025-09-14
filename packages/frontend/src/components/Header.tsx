import { getToday } from "../utils/date";
import { clerk } from "../utils/clerk";
import { Link } from "../components/Link";
import { useEffect, useState } from "preact/hooks";

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
    clerk.load().then(() => {
      if (clerk.user) {
        setNavLinks([...navigation, ...signOutLink]);
      } else {
        setNavLinks([...navigation, ...signInLink]);
      }
    });
  }, []);

  return (
    <header className="flex h-16 border-b border-gray-900/10 bg-primary">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center gap-x-6">
          <a href="/" className="p-1.5">
            <span className="sr-only">Comedy Cellar NYC Schedule</span>
            <img
              className="h-10 w-auto"
              src="https://www.comedycellar.com/wp-content/uploads/2023/03/TheComedyCellar_Famous_1981_logo_light.svg"
              alt=""
            />
          </a>
        </div>
        <nav className="flex text-xs gap-x-2 md:gap-x-8 md:text-sm font-semibold md:leading-6 md:text-black">
          {navLinks.map((item, itemIdx) => (
            <Link key={itemIdx} href={item.href} className="text-slate-950">
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
