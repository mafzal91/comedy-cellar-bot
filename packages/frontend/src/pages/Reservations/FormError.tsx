import { XCircleIcon } from "@heroicons/react/20/solid";

export function FormError({
  errors,
}: {
  errors: {
    field: string;
    message: string;
  }[];
}) {
  const errorLength = errors.length;
  return (
    <div className="rounded-card border-hair border-danger bg-danger-soft p-4">
      <div className="flex">
        <div className="shrink-0">
          <XCircleIcon className="size-5 text-danger" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="font-sans text-caption font-semibold text-danger">
            There{" "}
            {errorLength > 1 ? `were ${errorLength} errors` : `is 1 error`} with
            your submission
          </h3>
          <div className="mt-2 font-sans text-caption text-danger">
            <ul role="list" className="list-disc space-y-1 pl-5">
              {errors.map((error) => (
                <li key={error.field}>
                  {error.field}: {error.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
