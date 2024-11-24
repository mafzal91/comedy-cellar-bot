import { Comic } from "../../types";
import { ComicList } from "./ComicList";
import { Legend } from "./ShowCount";
import { fetchComics } from "../../utils/api";
import { useInfiniteQuery } from "react-query";
import { useObserver } from "../../hooks/useObserver";

export default function Comics() {
  const [ref, inView, entry] = useObserver<HTMLDivElement>({
    threshold: 0.5, // Adjust threshold as needed
    triggerOnce: true, // If you want the observer to unobserve after the first intersection
  });

  const { data, isFetching, hasNextPage, fetchNextPage } = useInfiniteQuery<
    Comic[]
  >(
    ["comics"],
    async ({ pageParam = 0 }) => {
      console.log({ pageParam });
      const comics = await fetchComics(pageParam);
      return comics.results;
    },
    {
      getNextPageParam: (lastPage, allPages) => {
        console.log({ lastPage, allPages });
        return lastPage.length ? allPages.length : undefined;
      },
      initialData: { pages: [[]], pageParams: [0] },
      refetchOnWindowFocus: false,
    }
  );

  const allComics = data?.pages.flat() ?? [];

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
