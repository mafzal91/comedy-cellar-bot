import { Img } from "../../components/Image";
import { Comic as ComicType } from "../../types";
const comics = [];
export function AlongsideComics({ comicId }: { comicId: string }) {
  return (
    <div className="mx-auto mt-4 max-w-5xl p-4 sm:px-6 lg:px-8">
      <h2 className="text-sm font-medium text-gray-500">See alongside:</h2>
      <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {comics.length ? (
          comics.map((comic) => (
            <div
              key={comic.externalId}
              className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-pink-500 focus-within:ring-offset-2 hover:border-gray-400"
            >
              <div className="flex-shrink-0">
                <Img
                  alt=""
                  src={comic.img}
                  className="h-10 w-10 rounded-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <a href="#" className="focus:outline-none">
                  <span aria-hidden="true" className="absolute inset-0" />
                  <p className="text-sm font-medium text-gray-900">
                    {comic.name}
                  </p>
                  {/* <p className="truncate text-sm text-gray-500">{comic.role}</p> */}
                </a>
              </div>
            </div>
          ))
        ) : (
          <span>Doesn't have any upcoming shows</span>
        )}
      </div>
    </div>
  );
}
