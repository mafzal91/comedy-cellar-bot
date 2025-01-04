import { Comic, ListApiRes } from "../../types";

import { ComicList } from "./ComicList";
import { Legend } from "./ShowCount";
import { fetchComics } from "../../utils/api";
import { useEffect } from "preact/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useObserver } from "../../hooks/useObserver";

export default function Comics() {
  const [ref, inView] = useObserver<HTMLDivElement>({
    threshold: 0.5, // Adjust threshold as needed
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
      console.log({ lastPage, allPages });
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

      <ComicList comics={allComics} isLoading={isFetching} />
      <div ref={ref} className="h-10" />
    </div>
  );
}
