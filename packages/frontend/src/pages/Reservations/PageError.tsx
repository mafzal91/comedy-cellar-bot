export function PageError() {
  return (
    <div className="flex h-[calc(100vh-72px)] items-center justify-center">
      <div className="text-center">
        <p className="font-mono text-label uppercase tracking-widest text-gold">
          500
        </p>
        <h1 className="mt-4 font-display text-d-xl text-text">Error</h1>
        <p className="mt-6 font-sans text-body text-muted">
          Sorry, An error occured on the page you were trying to access.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a
            href="/"
            className="rounded-pill bg-solid px-5 py-3 font-sans font-semibold text-solid-fg transition hover:bg-solid-hover"
          >
            Go back home
          </a>
        </div>
      </div>
    </div>
  );
}
