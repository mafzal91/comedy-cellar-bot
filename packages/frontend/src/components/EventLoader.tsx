export function EventLoader() {
  return (
    <div class="animate-pulse grow flex space-x-4">
      <div class="hidden sm:flex shrink-0 space-y-4 items-center">
        <div class="grid grid-cols-1">
          <div class="rounded-full bg-gray-300 size-8"></div>
          <div class="mt-0.5 h-4 bg-gray-300 rounded-sm" />
        </div>
      </div>

      <div class="flex-1 space-y-4">
        <div class="grid grid-cols-6 gap-4">
          <div class="h-4 bg-gray-300	rounded-sm col-span-5 sm:col-span-4" />
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-7 gap-4 divide-x divide-gray-100">
            <div class="h-4 bg-gray-300	rounded-sm col-span-4 xl:col-span-2" />
            <div class="h-4 bg-gray-300 rounded-sm col-span-4 xl:col-span-2" />
            <div class="h-4 bg-gray-300 rounded-sm col-span-4 xl:col-span-2" />
            <div class="sm:hidden h-4 bg-gray-300 rounded-sm col-span-4 xl:col-span-2" />
          </div>
        </div>
      </div>

      <div className="mt-0.5 flex items-center">
        <span
          aria-disabled={true}
          className="mr-2 rounded-sm bg-gray-300 px-2 py-1 text-xs font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300"
        >
          <div className="-ml-0.5 h-5 w-5"></div>
        </span>
        <span className="rounded-sm bg-gray-300 px-2 py-1 text-xs font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300">
          <div className="-ml-0.5 size-5"></div>
        </span>
      </div>
    </div>
  );
}
