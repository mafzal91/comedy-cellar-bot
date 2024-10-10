import { getToday } from "../utils/date";

export function Header() {
  return (
    <header className="bg-primary">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between p-4"
        aria-label="Global"
      >
        <div className="flex grow items-center justify-center">
          <a href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Comedy Cellar NYC Schedule</span>
            <img
              className="h-10 w-auto"
              src="https://www.comedycellar.com/wp-content/uploads/2023/03/TheComedyCellar_Famous_1981_logo_light.svg"
              alt=""
            />
          </a>
          {/* <a href="/comics" className="-m-1.5 p-1.5">
            Comics
          </a> */}
        </div>
      </nav>
    </header>
  );
}
const navigation = [
  { name: "Home", href: `/?date=${getToday()}` },
  { name: "Comics", href: "/comics" },
  // { name: "Rooms", href: "/rooms" },
];
export function Header1() {
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
        <nav className="flex md:gap-x-11 md:text-sm font-semibold md:leading-6 md:text-black">
          {navigation.map((item, itemIdx) => (
            <a key={itemIdx} href={item.href}>
              {item.name}
            </a>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-x-8"></div>
      </div>
    </header>
  );
}
