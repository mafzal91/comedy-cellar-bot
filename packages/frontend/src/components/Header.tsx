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
