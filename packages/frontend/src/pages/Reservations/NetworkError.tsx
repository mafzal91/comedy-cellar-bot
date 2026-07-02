import { useState } from "preact/hooks";

import { XCircleIcon, XMarkIcon } from "@heroicons/react/20/solid";

export function NetworkError({ message }: { message: string }) {
  const [isVisible, setIsVisible] = useState(true);
  const dismissError = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }
  return (
    <div className="rounded-card border-hair border-danger bg-danger-soft p-4">
      <div className="flex">
        <div className="shrink-0">
          <XCircleIcon className="size-5 text-danger" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="font-sans text-caption font-semibold text-danger">
            {message}
          </h3>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={dismissError}
              className="inline-flex rounded-field p-1.5 text-danger transition hover:bg-danger/10 focus:outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
