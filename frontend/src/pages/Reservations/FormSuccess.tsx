import { CheckCircleIcon } from "@heroicons/react/20/solid";

export function FormSuccess({ message }: { message: string }) {
  return (
    <div className="rounded-md bg-green-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <CheckCircleIcon
            className="h-5 w-5 text-green-400"
            aria-hidden="true"
          />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">
            Order completed
          </h3>
          <small className="text-sm text-green-800">
            A message from the Cellar:
          </small>
          <div
            className="mt-2 text-sm text-green-700"
            dangerouslySetInnerHTML={{ __html: message }}
          ></div>
          <div className="mt-4">
            <div className="-mx-2 -my-1.5 flex"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
