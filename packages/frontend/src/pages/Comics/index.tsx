import { useQuery } from "react-query";
import { Comic } from "../../types";
import { fetchComics } from "../../utils/api";
import { ComicList } from "./ComicList";

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

  return <ComicList comics={data} isLoading={isFetching} />;
}
