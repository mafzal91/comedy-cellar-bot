import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { Comic } from "../../types";
import { ComicList } from "./ComicList";
import { Legend } from "./ShowCount";
import { fetchComics } from "../../utils/api";

export default function Comics() {
  const { data, isFetching } = useQuery<Comic[]>({
    queryKey: ["comics"],
    queryFn: async () => {
      const comics = await fetchComics();
      return comics.results;
    },
  });

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
