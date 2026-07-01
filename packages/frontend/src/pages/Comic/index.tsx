import { AlongsideComics } from "./AlongsideComics";
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
        className="mb-4 inline-block font-mono uppercase text-label tracking-wider text-muted hover:text-text hover:no-underline"
      >
        ‹ All comics
      </Link>

      {/* Profile card */}
      <div className="overflow-hidden rounded-2xl border-hair border-line bg-surface shadow-block-lg">
        <ComicBannerImage />

        <div className="relative px-6 pb-8 sm:px-10">
          {/* Identity row — pulled up over the banner */}
          <div className="-mt-[4.125rem] flex items-end justify-between gap-5">
            <div className="flex items-end gap-6">
              <Avatar
                name={comic.data.name}
                size={132}
                className="border-4 shadow-block"
              />
              <div className="pb-2">
                <Eyebrow className="mb-1">Headliner</Eyebrow>
                <h1 className="m-0 font-display text-d-lg tracking-tightcap text-text">
                  {comic.data.name}
                </h1>
              </div>
            </div>

            <div className="mb-2.5 flex shrink-0 items-center gap-3">
              {user && <ComicNotification />}
              {comic.data.website && (
                <Link
                  href={comic.data.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-pill border-hair border-line bg-surface px-5 py-2.5 font-sans text-sm font-bold text-text shadow-block-sm transition hover:bg-brand hover:text-brand-fg hover:no-underline"
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

          {/* <AlongsideComics comicId={comicId} /> */}
        </div>
      </div>
    </div>
  );
}
