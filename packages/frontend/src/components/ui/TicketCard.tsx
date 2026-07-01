import clsx from "clsx";

type TicketCardProps = {
  className?: string;
  children?: React.ReactNode;
};

/**
 * Base surface card used as the ticket body. Thin, unopinionated wrapper —
 * just the signature surface + hairline border + block shadow. Compose with
 * TicketStub / CardHeader / CardBody etc. for richer layouts.
 */
export function TicketCard({ className, children }: TicketCardProps) {
  return (
    <div
      className={clsx(
        "bg-surface border-hair border-line rounded-panel shadow-block-md overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
