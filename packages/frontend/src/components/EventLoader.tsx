export function EventLoader() {
  return (
    <div className="flex animate-pulse overflow-hidden rounded-card border-hair border-line bg-surface shadow-block">
      <div className="w-28 shrink-0 border-r-2 border-dashed border-line bg-track" />
      <div className="min-w-0 flex-1 space-y-3 px-5 py-4">
        <div className="sm:flex sm:items-start sm:justify-between sm:gap-3">
          <div className="hidden shrink-0 items-center gap-2.5 sm:flex">
            <div className="h-4 w-20 rounded-pill bg-track" />
            <div className="size-8 rounded-full bg-track" />
            <div className="size-8 rounded-full bg-track" />
          </div>
          <div className="h-4 w-44 rounded bg-track sm:order-1" />
        </div>

        <div className="h-3 w-32 rounded bg-track" />

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3.5">
          <div className="h-1.5 flex-1 rounded-pill bg-track" />
          <div className="flex items-center justify-end gap-2">
            <div className="h-4 w-20 rounded-pill bg-track sm:hidden" />
            <div className="h-9 w-36 rounded-pill bg-track" />
            <div className="flex items-center gap-2 sm:hidden">
              <div className="size-8 rounded-full bg-track" />
              <div className="size-8 rounded-full bg-track" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
