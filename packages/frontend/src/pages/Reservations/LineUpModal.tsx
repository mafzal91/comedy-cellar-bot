import { useEffect } from "preact/hooks";

import { Avatar } from "../../components/ui/Avatar";
import { Eyebrow } from "../../components/ui/Eyebrow";
import { LineUp } from "../../types";

export function LineUpModal(props: { lineUp: LineUp; onClose: () => void }) {
  const { lineUp, onClose } = props;

  // Close on Escape and lock body scroll while the modal is open.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Show lineup"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-ink/70" />

      <div
        className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-panel border-hair border-line bg-surface shadow-block-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b-hair border-line px-6 py-5">
          <div>
            <Eyebrow>The Lineup</Eyebrow>
            <h2 className="mt-1 font-display text-d-sm leading-none text-text">
              Tonight's Acts
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close lineup"
            className="grid size-8 shrink-0 place-items-center rounded-pill border-hair border-line bg-surface font-mono text-body text-muted hover:text-text"
          >
            ×
          </button>
        </div>

        <ul className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
          {lineUp.acts.map((act) => (
            <li key={act.name} className="flex items-center gap-3.5">
              <Avatar name={act.name} img={act.img} size={48} />
              <div className="min-w-0">
                <p className="truncate font-sans text-body font-bold text-text">
                  {act.name}
                </p>
                {act.description && (
                  <p className="truncate font-mono text-meta text-muted">
                    {act.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
