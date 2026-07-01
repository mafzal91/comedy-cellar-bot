import { Comic, ListApiRes } from "../../types";
import { ComicItem, ComicItemSkeleton } from "./ComicItem";

import { Legend } from "./ShowCount";
import { SearchInput } from "../../components/SearchInput";
import { PageHeader } from "../../components/ui/PageHeader";
import { fetchComics } from "../../utils/api";
import { useEffect, useState } from "preact/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useObserver } from "../../hooks/useObserver";
import { useLocation } from "preact-iso";

export default function Comics() {
  const { query, route } = useLocation();

  const [searchTerm, setSearchTerm] = useState(query.search || "");

  const [ref, inView] = useObserver<HTMLDivElement>({
    threshold: 0,
    triggerOnce: false,
  });

  const { data, fetchNextPage, hasNextPage, isFetching, isLoading } =
    useInfiniteQuery<ListApiRes<Comic>>({
      queryKey: ["comics", searchTerm],
      queryFn: async ({ pageParam = 0 }) => {
        const comics = await fetchComics({
          offset: pageParam as number,
          name: searchTerm.length >= 2 ? searchTerm : undefined,
        });
        return comics;
      },
      getNextPageParam: (lastPage, allPages) => {
        if (allPages.length < lastPage.total / lastPage.limit) {
          return lastPage.offset + lastPage.limit;
        }
        return undefined;
      },
      initialData: { pages: [], pageParams: [] },
      initialPageParam: 0,
      refetchOnWindowFocus: false,
    });

  const allComics = data?.pages.flatMap((page) => page.results) ?? [];
  const hasResults = allComics.length > 0;
  const showNoResults =
    !isLoading && !isFetching && searchTerm.length >= 2 && !hasResults;
  const showInitialSkeletons = isLoading;
  const showInfiniteScrollSkeletons = isFetching && !isLoading;

  // Sync search term with URL when query changes (e.g., browser back/forward)
  useEffect(() => {
    const searchFromUrl = query.search || "";
    if (searchFromUrl !== searchTerm) {
      setSearchTerm(searchFromUrl);
    }
  }, [query.search]);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, inView, hasNextPage]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);

    if (value.trim()) {
      route(`/comics?search=${encodeURIComponent(value)}`, true);
    } else {
      route("/comics", true); // Clear search parameter but stay on comics page
    }
  };

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-8">
      <PageHeader eyebrow="The Lineup" title="Meet the Comics" />

      {/* Toolbar */}
      <div className="rounded-panel border-hair border-line bg-surface px-[22px] py-5 shadow-block-md">
        <SearchInput
          placeholder="Search by comic name…"
          value={searchTerm}
          onSearch={handleSearch}
          loading={isFetching && !isLoading}
        />

        <div className="mt-4">
          <Legend />
        </div>
      </div>

      {/* No Results State */}
      {showNoResults && (
        <div className="py-12 text-center font-mono text-caption text-faint">
          No comics match “{searchTerm}”.
        </div>
      )}

      {/* Initial Skeleton Loaders - Show only for initial loading */}
      {showInitialSkeletons && (
        <ul
          role="list"
          className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-4"
        >
          {Array.from({ length: 12 }).map((_, index) => (
            <ComicItemSkeleton key={`initial-skeleton-${index}`} />
          ))}
        </ul>
      )}

      {/* Comics Grid - Show when not in initial loading state */}
      {!showInitialSkeletons && (
        <ul
          role="list"
          className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-4"
        >
          {allComics.map((comic) => (
            <ComicItem key={comic.name} comic={comic} />
          ))}
          {/* Infinite scroll skeletons at the bottom */}
          {showInfiniteScrollSkeletons &&
            Array.from({ length: 8 }).map((_, index) => (
              <ComicItemSkeleton key={`infinite-skeleton-${index}`} />
            ))}
        </ul>
      )}

      {/* Infinite Scroll Trigger */}
      {!isFetching && hasResults && <div ref={ref} className="h-10" />}
    </div>
  );
}
