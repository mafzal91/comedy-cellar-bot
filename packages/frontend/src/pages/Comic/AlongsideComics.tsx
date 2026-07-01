import { Img } from "../../components/Image";
import { Comic as ComicType } from "../../types";
const comics = [];
export function AlongsideComics({ comicId }: { comicId: string }) {
  return (
    <div className="mt-8">
      <h2 className="mb-3 font-mono uppercase text-label tracking-wider text-faint">
        See alongside:
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {comics.length ? (
          comics.map((comic) => (
            <div
              key={comic.externalId}
              className="relative flex items-center gap-x-3 rounded-card border-hair border-line bg-surface px-6 py-5 shadow-block-sm transition focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2 hover:-translate-x-px hover:-translate-y-px hover:shadow-block"
            >
              <div className="shrink-0">
                <Img
                  alt=""
                  src={comic.img}
                  className="size-10 rounded-pill border-hair border-line"
                />
              </div>
              <div className="min-w-0 flex-1">
                <a href="#" className="focus:outline-hidden">
                  <span aria-hidden="true" className="absolute inset-0" />
                  <p className="font-sans text-body font-bold text-text">
                    {comic.name}
                  </p>
                  {/* <p className="truncate text-sm text-muted">{comic.role}</p> */}
                </a>
              </div>
            </div>
          ))
        ) : (
          <span className="font-mono text-caption text-muted">
            Doesn't have any upcoming shows
          </span>
        )}
      </div>
    </div>
  );
}
