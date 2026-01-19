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
    <div className="rounded-md bg-red-50 p-4">
      <div className="flex">
        <div className="shrink-0">
          <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            There{" "}
            {errorLength > 1 ? `were ${errorLength} errors` : `is 1 error`} with
            your submission
          </h3>
          <div className="mt-2 text-sm text-red-700">
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
