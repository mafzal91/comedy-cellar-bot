import { FireIcon } from "@heroicons/react/20/solid";
import { FireIcon as EmptyFire } from "@heroicons/react/24/outline";
import { SlashIcon } from "@heroicons/react/24/outline";

export function ActivityIcon() {
  return <FireIcon className="h-5 w-5 fill-yellow-400 stroke-orange-300" />;
}

export function ShowCount({ showCount }: { showCount: number }) {
  if (showCount > 0) {
    const iconCount = showCount > 8 ? 3 : showCount >= 5 ? 2 : 1;
    return (
      <div className="flex items-center">
        {[...Array(iconCount)].map((_, index) => (
          <ActivityIcon key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="">
      <FireIcon className="h-5 w-5 fill-neutral-400" />
    </div>
  );
}

export function Legend() {
  return (
    <div className="flex flex-col sm:flex-row item-center sm:space-x-2">
      <div className="flex items-center">
        <div className="relative fill-neutral-400">
          <FireIcon className="h-5 w-5 fill-neutral-400" />
        </div>
        <span className="ml-2">No Shows</span>
      </div>
      <span className="hidden sm:block"> | </span>
      <div className="flex items-center">
        <ActivityIcon />
        <span className="ml-2">1-4 Shows</span>
      </div>
      <span className="hidden sm:block"> | </span>{" "}
      <div className="flex items-center">
        <ActivityIcon />
        <ActivityIcon />
        <span className="ml-2">5-8 Shows</span>
      </div>
      <span className="hidden sm:block"> | </span>{" "}
      <div className="flex items-center">
        <ActivityIcon />
        <ActivityIcon />
        <ActivityIcon />
        <span className="ml-2">9+ Shows</span>
      </div>
    </div>
  );
}
