import type { ComponentChildren } from "preact";
import clsx from "clsx";

type TicketStubProps = {
  className?: string;
  children?: ComponentChildren;
};

export function TicketStub({ className, children }: TicketStubProps) {
  return (
    <div
      className={clsx(
        "relative bg-bg border-l-2 border-dashed border-line p-6 md:p-8",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute -left-[7px] top-3 h-3.5 w-3.5 rounded-full bg-bg border-hair border-line"
      />
      <span
        aria-hidden="true"
        className="absolute -left-[7px] bottom-3 h-3.5 w-3.5 rounded-full bg-bg border-hair border-line"
      />
      {children}
    </div>
  );
}
