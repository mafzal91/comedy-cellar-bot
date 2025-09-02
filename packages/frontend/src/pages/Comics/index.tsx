import { Comic, ListApiRes } from "../../types";
import { ComicItem, ComicItemSkeleton } from "./ComicItem";

import { Legend } from "./ShowCount";
import { SearchInput } from "../../components/SearchInput";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { fetchComics } from "../../utils/api";
import { useEffect, useState } from "preact/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useObserver } from "../../hooks/useObserver";

export default function Comics() {
  const [searchTerm, setSearchTerm] = useState("");

  const [ref, inView] = useObserver<HTMLDivElement>({
    threshold: 0, // Adjust threshold as needed
    triggerOnce: false, // If you want the observer to unobserve after the first intersection
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
        console.log(lastPage, allPages);
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
  const totalCount = data?.pages?.[0]?.total ?? 0;
  const hasResults = allComics.length > 0;
  const showNoResults =
    !isLoading && !isFetching && searchTerm.length >= 2 && !hasResults;
  const showInitialSkeletons = isLoading;
  const showInfiniteScrollSkeletons = isFetching && !isLoading;

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, inView, hasNextPage]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  return (
    <div className="flex flex-col gap-y-8">
      {/* Search Section */}
      <div className="flex flex-col gap-4 p-4 rounded-lg ring-1 ring-gray-200 shadow hover:shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h6 className="text-md font-bold">Search Comics</h6>
          {searchTerm.length >= 2 && (
            <span className="text-sm text-gray-600">
              {totalCount} result{totalCount !== 1 ? "s" : ""} for "{searchTerm}
              "
            </span>
          )}
        </div>
        <SearchInput
          placeholder="Search by comic name..."
          value={searchTerm}
          onSearch={handleSearch}
          loading={isFetching && !isLoading}
          className="max-w-md"
        />

        <span className="text-md font-bold">Upcoming shows</span>
        <Legend />
      </div>

      {/* No Results State */}
      {showNoResults && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No comics found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            No comics match your search for "{searchTerm}". Try a different
            search term.
          </p>
        </div>
      )}

      {/* Initial Skeleton Loaders - Show only for initial loading */}
      {showInitialSkeletons && (
        <ul
          role="list"
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4"
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
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4"
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
