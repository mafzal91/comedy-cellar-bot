import { CheckCircleIcon } from "@heroicons/react/20/solid";

export function FormSuccess({ message }: { message: string }) {
  return (
    <div className="rounded-card border-hair border-success bg-success-soft p-4">
      <div className="flex">
        <div className="shrink-0">
          <CheckCircleIcon
            className="size-5 text-success"
            aria-hidden="true"
          />
        </div>
        <div className="ml-3">
          <h3 className="font-sans text-caption font-semibold text-success">
            Order completed
          </h3>
          <small className="font-sans text-caption text-success">
            A message from the Cellar:
          </small>
          <div
            className="mt-2 font-sans text-caption text-success"
            // Trusted first-party API success message that is delivered as HTML.
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: message }}
          />
          <div className="mt-4">
            <div className="-mx-2 -my-1.5 flex" />
          </div>
        </div>
      </div>
    </div>
  );
}
