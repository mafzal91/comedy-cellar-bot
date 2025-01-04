import { Comic } from "../../types";
import { Img } from "../../components/Image";
import { LinkIcon } from "@heroicons/react/24/outline";
import { ShowCount } from "./ShowCount";

export function ComicItem({ comic }: { comic: Comic }) {
  return (
    <li
      key={comic.externalId}
      className="flex-col grow rounded-lg ring-1 ring-gray-200 shadow transition-shadow duration-300 hover:shadow-md"
    >
      <a href={`/comics/${comic.externalId}`} className={"grow-1"}>
        <Img
          alt={`${comic.name}'s picture`}
          loading={"lazy"}
          src={comic.img}
          className="aspect-[3/2] w-full rounded-lg object-cover"
        />
        <div className="flex-col grow-1 justify-between p-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold leading-8 tracking-tight text-gray-900">
              {comic.name}
            </h3>
            <ShowCount showCount={comic.showCount ?? 0} />
          </div>
          <p className="text-base leading-7 text-gray-600 line-clamp-4">
            {comic.description}
          </p>
          <ul role="list" className="mt-6 flex gap-x-6">
            <li>
              <a
                href={comic.website}
                target="_blank"
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Website</span>
                <LinkIcon aria-hidden="true" className="h-5 w-5" />
              </a>
            </li>
          </ul>
        </div>
      </a>
    </li>
  );
}

export function ComicItemSkeleton() {
  return (
    <li className="animate-pulse flex flex-col grow rounded-lg ring-1 ring-gray-200 shadow transition-shadow duration-300 hover:shadow-md">
      <div className="flex-1 flex flex-col">
        <div className="aspect-[3/2] w-full rounded-lg bg-gray-300" />
        <div className="flex flex-col flex-1 justify-between p-4 space-y-4">
          <div className="h-6 bg-gray-300 rounded w-3/4" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-full" />
            <div className="h-4 bg-gray-300 rounded w-5/6" />
            <div className="h-4 bg-gray-300 rounded w-4/6" />
          </div>
          <ul role="list" className="mt-6 flex gap-x-6">
            <li>
              <div className="h-5 w-5 bg-gray-300 rounded-full" />
            </li>
          </ul>
        </div>
      </div>
    </li>
  );
}
