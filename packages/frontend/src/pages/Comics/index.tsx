import { useQuery } from "react-query";
import { Comic } from "../../types";
import { fetchComics } from "../../utils/api";
import { ComicList } from "./ComicList";
import { Legend } from "./ShowCount";

export default function Comics() {
  const { data, isFetching } = useQuery<Comic[]>(
    ["comics"],
    async () => {
      const comics = await fetchComics();

      return comics.results;
    },
    {
      initialData: [],
      refetchOnWindowFocus: false,
    }
  );

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col p-4 rounded-lg ring-1 ring-gray-200 shadow hover:shadow-md">
        <h6 className="text-md font-bold">Upcoming shows</h6>
        <Legend />
      </div>
      <ComicList comics={data} isLoading={isFetching} />
    </div>
  );
}
