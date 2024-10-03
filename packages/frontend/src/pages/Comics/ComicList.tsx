import { GlobeAltIcon, UserCircleIcon } from "@heroicons/react/20/solid";
import { Comic } from "../../types";
import { Img } from "../../components/Image";

function ComicItem({ comic }: { comic: Comic }) {
  return (
    <li
      key={comic.name}
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
          <h3 className="text-lg font-semibold leading-8 tracking-tight text-gray-900">
            {comic.name}
          </h3>
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
                <GlobeAltIcon aria-hidden="true" className="h-5 w-5 " />
              </a>
            </li>
          </ul>
        </div>
      </a>
    </li>
  );
}

export function ComicList({ comics }: { comics: Comic[] }) {
  return (
    <ul
      role="list"
      className="mx-auto mt-20 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3"
    >
      {comics.map((comic) => (
        <ComicItem comic={comic} />
      ))}
    </ul>
  );
}
