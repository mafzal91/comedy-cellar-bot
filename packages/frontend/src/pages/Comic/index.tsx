import ComicBannerImage from "./ComicBannerImage";
import ComicNotification from "./ComicNotification";
import { Comic as ComicType } from "../../types";
import { Avatar } from "../../components/ui/Avatar";
import { Eyebrow } from "../../components/ui/Eyebrow";
import { Link } from "../../components/Link";
import { PageLoader } from "../../components/PageLoader";
import { UpcomingShows } from "./UpcomingShows";
import { fetchComicById } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "preact-iso";

export default function Comic() {
  const user = useAuth();
  const { params } = useRoute();
  const comicId = params.id;
  const comic = useQuery<ComicType>({
    queryKey: ["comics", params.id],
    queryFn: async () => {
      const comic = await fetchComicById({
        externalId: comicId,
      });

      return comic;
    },
    refetchOnWindowFocus: false,
  });

  if (comic.isFetching) {
    return <PageLoader />;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 pt-8 pb-16 sm:px-10">
      <Link
        href="/comics"
        variant="plain"
        className="mb-4 inline-block font-mono uppercase text-label tracking-wider text-muted hover:text-text hover:no-underline"
      >
        ‹ All comics
      </Link>

      {/* Profile card */}
      <div className="overflow-hidden rounded-2xl border-hair border-line bg-surface shadow-block-lg">
        <ComicBannerImage />

        <div className="relative px-6 pb-8 sm:px-10">
          {/* Identity row — only the avatar overlaps the banner; name and
              buttons always start below the banner edge so a wrapping name
              grows downward, never up into the photo. Stacks below sm. */}
          <div className="-mt-[4.125rem] flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:gap-6">
              <Avatar
                name={comic.data.name}
                img={comic.data.img}
                size={132}
                className="border-4 shadow-block"
              />
              <div className="min-w-0 sm:pt-[4.625rem]">
                <Eyebrow className="mb-1">Headliner</Eyebrow>
                <h1 className="m-0 break-words font-display text-d-md tracking-tightcap text-text sm:text-d-lg">
                  {comic.data.name}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:justify-end sm:pt-[4.75rem]">
              {user && <ComicNotification />}
              {comic.data.website && (
                <Link
                  href={comic.data.website}
                  target="_blank"
                  rel="noreferrer"
                  variant="plain"
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border-hair border-line bg-surface px-5 py-2.5 font-sans text-sm font-bold text-text shadow-block-sm transition hover:bg-brand hover:text-brand-fg hover:no-underline"
                >
                  Website ↗
                </Link>
              )}
            </div>
          </div>

          {/* About */}
          <div className="mt-8 max-w-[680px]">
            <p className="mb-2.5 font-mono uppercase text-label tracking-wider text-faint">
              About
            </p>
            <p className="m-0 font-sans text-[17px] leading-[1.65] text-text">
              {comic.data.description}
            </p>
          </div>

          <UpcomingShows comicId={comicId} />

          {/* <AlongsideComics /> */}
        </div>
      </div>
    </div>
  );
}
