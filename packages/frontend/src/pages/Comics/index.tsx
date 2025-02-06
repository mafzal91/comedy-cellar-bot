import { Comic, ListApiRes } from "../../types";
import { ComicItem, ComicItemSkeleton } from "./ComicItem";

import { Legend } from "./ShowCount";
import { fetchComics } from "../../utils/api";
import { useEffect } from "preact/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useObserver } from "../../hooks/useObserver";

export default function Comics() {
  const [ref, inView] = useObserver<HTMLDivElement>({
    threshold: 0, // Adjust threshold as needed
    triggerOnce: false, // If you want the observer to unobserve after the first intersection
  });

  const { data, fetchNextPage, isFetching } = useInfiniteQuery<
    ListApiRes<Comic>
  >({
    queryKey: ["comics"],
    queryFn: async ({ pageParam = 0 }) => {
      const comics = await fetchComics({
        offset: pageParam as number,
      });
      return comics;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.offset + lastPage.limit;
    },
    initialData: { pages: [], pageParams: [] },
    initialPageParam: 0,
    refetchOnWindowFocus: false,
  });

  const allComics = data?.pages.flatMap((page) => page.results) ?? [];

  useEffect(() => {
    if (inView) {
      fetchNextPage();
    }
  }, [fetchNextPage, inView]);

  return (
    <div className="flex flex-col gap-y-8">
      <div className="flex flex-col p-4 rounded-lg ring-1 ring-gray-200 shadow hover:shadow-md">
        <h6 className="text-md font-bold">Upcoming shows</h6>
        <Legend />
      </div>

      <ul
        role="list"
        className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4"
      >
        {allComics.map((comic) => (
          <ComicItem key={comic.name} comic={comic} />
        ))}
        {isFetching &&
          Array.from({ length: 12 }).map((_, index) => (
            <ComicItemSkeleton key={index} />
          ))}
      </ul>

      {!isFetching && <div ref={ref} className="h-10" />}
    </div>
  );
}
