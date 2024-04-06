export function PageError() {
  return (
    <div className="flex justify-center items-center h-[calc(100vh-72px)]">
      <div className="text-center">
        <p className="text-base font-semibold text-primary">500</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Error
        </h1>
        <p className="mt-6 text-base leading-7 text-gray-600">
          Sorry, An error occured on the page you were trying to access.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a
            href="/"
            className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-white hover:text-primary hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Go back home
          </a>
        </div>
      </div>
    </div>
  );
}
