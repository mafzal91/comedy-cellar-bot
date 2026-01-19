import * as Preact from "preact";

export function Card({ children }: { children: React.ReactNode }) {
  const childrenArray = Preact.toChildArray(children);
  const headers = childrenArray
    .filter(
      (child): child is Preact.VNode =>
        typeof child !== "string" && typeof child !== "number"
    )
    .filter((child) => child.type === CardHeader);
  const body = childrenArray
    .filter(
      (child): child is Preact.VNode =>
        typeof child !== "string" && typeof child !== "number"
    )
    .filter((child) => child.type === CardBody);
  const footer = childrenArray
    .filter(
      (child): child is Preact.VNode =>
        typeof child !== "string" && typeof child !== "number"
    )
    .filter((child) => child.type === CardFooter);
  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow-sm">
      {headers.map((header) => header)}
      {body.map((body) => body)}
      {footer.map((footer) => footer)}
    </div>
  );
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-5 sm:px-6">{children}</div>;
}

export function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-5 sm:p-6">{children}</div>;
}

export function CardFooter({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-4 sm:px-6">{children}</div>;
}
