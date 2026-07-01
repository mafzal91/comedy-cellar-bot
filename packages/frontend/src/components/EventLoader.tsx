export function EventLoader() {
  return (
    <div className="flex animate-pulse overflow-hidden rounded-card border-hair border-line bg-surface shadow-block">
      <div className="w-28 shrink-0 border-r-2 border-dashed border-line bg-track" />
      <div className="min-w-0 flex-1 space-y-3 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="h-4 w-44 rounded bg-track" />
          <div className="h-4 w-20 rounded-pill bg-track" />
        </div>
        <div className="h-3 w-32 rounded bg-track" />
        <div className="flex items-center gap-3.5">
          <div className="h-1.5 flex-1 rounded-pill bg-track" />
          <div className="h-9 w-36 rounded-pill bg-track" />
        </div>
      </div>
    </div>
  );
}
