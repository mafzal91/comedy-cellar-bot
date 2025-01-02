import { Comic } from "../../types";
import { ComicList } from "./ComicList";
import { Legend } from "./ShowCount";
import { fetchComics } from "../../utils/api";
import { useQuery } from "@tanstack/react-query";

export default function Comics() {
  const { data, isFetching } = useQuery<Comic[]>({
    queryKey: ["comics"],
    queryFn: async () => {
      const comics = await fetchComics();

      return comics.results;
    },
    refetchOnWindowFocus: false,
    initialData: [],
  });

  return (
    <div className="flex flex-col gap-y-8">
      <div className="flex flex-col p-4 rounded-lg ring-1 ring-gray-200 shadow hover:shadow-md">
        <h6 className="text-md font-bold">Upcoming shows</h6>
        <Legend />
      </div>
      <ComicList comics={data} isLoading={isFetching} />
    </div>
  );
}
