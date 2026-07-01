import { Comic } from "../../types";
import { ShowCount } from "./ShowCount";
import { getInitials, getSwatch } from "../../utils/swatches";

export function ComicItem({ comic }: { comic: Comic }) {
  const { bg, fg } = getSwatch(comic.name);
  const initials = getInitials(comic.name);

  return (
    <li key={comic.externalId} className="list-none">
      <a
        href={`/comics/${comic.externalId}`}
        className="block overflow-hidden rounded-card border-hair border-line bg-surface shadow-block transition-all duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-block-lg focus:outline-none focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-block-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {/* Photo placeholder — swatch bg + centered Bebas initials */}
        <div
          className="relative flex h-[170px] items-center justify-center border-b-[1.5px] border-line"
          style={{ backgroundColor: bg }}
          role="img"
          aria-label={`${comic.name}'s photo`}
        >
          <span
            className="font-display text-[62px] leading-none tracking-[0.04em]"
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

        {/* Body */}
        <div className="px-4 pb-4 pt-[14px]">
          <h3 className="mb-[7px] font-sans text-[16px] font-extrabold text-text">
            {comic.name}
          </h3>
          <div className="mb-[9px]">
            <ShowCount showCount={comic.showCount ?? 0} />
          </div>
          <p className="line-clamp-3 font-sans text-caption leading-[1.5] text-muted">
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
