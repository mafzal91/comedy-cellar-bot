import { Comic } from "../../types";
import { Img } from "../../components/Image";
import { ShowCount } from "./ShowCount";
import { getInitials, getSwatch } from "../../utils/swatches";

export function ComicItem({ comic }: { comic: Comic }) {
  const { bg, fg } = getSwatch(comic.name);
  const initials = getInitials(comic.name);

  return (
    <li key={comic.externalId} className="list-none h-full">
      <a
        href={`/comics/${comic.externalId}`}
        className="flex h-full flex-col overflow-hidden rounded-card border-hair border-line bg-surface shadow-block transition-all duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-block-lg focus:outline-none focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-block-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {/* Photo — falls back to the swatch + initials placeholder when comic.img is missing */}
        <div className="relative h-44 overflow-hidden border-b-2 border-line">
          {comic.img ? (
            <Img
              alt={`${comic.name}'s photo`}
              loading="lazy"
              src={comic.img}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full items-center justify-center"
              style={{ backgroundColor: bg }}
              role="img"
              aria-label={`${comic.name}'s photo`}
            >
              <span
                className="font-display text-8xl leading-none tracking-[0.04em]"
                style={{ color: fg }}
              >
                {initials}
              </span>
              <span
                className="absolute bottom-2 right-2.5 font-mono text-[8px] uppercase tracking-wider"
                style={{ color: fg, opacity: 0.55 }}
              >
                PHOTO
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 px-4 pb-4 pt-4">
          <h3 className="mb-2 font-sans text-base font-extrabold text-text">
            {comic.name}
          </h3>
          <div className="mb-3">
            <ShowCount showCount={comic.showCount ?? 0} />
          </div>
          <p className="line-clamp-3 font-sans text-caption leading-relaxed text-muted">
            {comic.description}
          </p>
        </div>
      </a>
    </li>
  );
}

export function ComicItemSkeleton() {
  return (
    <li className="list-none animate-pulse">
      <div className="block overflow-hidden rounded-card border-hair border-line bg-surface shadow-block">
        <div className="h-[170px] border-b-[1.5px] border-line bg-track" />
        <div className="flex flex-col gap-3 px-4 pb-4 pt-[14px]">
          <div className="h-4 w-3/4 rounded-field bg-track" />
          <div className="h-3 w-1/2 rounded-field bg-track" />
          <div className="flex flex-col gap-2">
            <div className="h-3 w-full rounded-field bg-track" />
            <div className="h-3 w-5/6 rounded-field bg-track" />
            <div className="h-3 w-4/6 rounded-field bg-track" />
          </div>
        </div>
      </div>
    </li>
  );
}
