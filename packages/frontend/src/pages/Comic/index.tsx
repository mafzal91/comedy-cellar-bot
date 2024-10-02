import { useRoute } from "preact-iso";
import { ChevronLeftIcon } from "@heroicons/react/20/solid";
import { useQuery } from "react-query";
import { Comic as ComicType } from "../../types";
import { fetchComicById } from "../../utils/api";
import { PageLoader } from "../../components/PageLoader";
import { AlongsideComics } from "./AlongsideComics";
import { Img } from "../../components/Image";
import { UpcomingShows } from "./UpcomingShows";

const coverImg = [
  "/cellar.webp",
  "/ComedyCellar_MacDougalstNYC.jpg",
  "/TheStairs_empty.jpg",
];

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export default function Comic() {
  const { params } = useRoute();
  const comicId = params.id;
  const { data, isFetching } = useQuery<ComicType>(
    ["comics", params.id],
    async () => {
      const comic = await fetchComicById({
        externalId: comicId,
      });

      return comic;
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  if (isFetching) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-full flex flex-1 rounded-lg ring-1 ring-gray-200">
      <div className="flex-1 pb-8">
        <div>
          <img
            alt=""
            src={coverImg[getRandomInt(3)]}
            className="h-32 w-full object-cover rounded-t-lg lg:h-48"
          />
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="-mt-12 sm:-mt-16 sm:flex sm:items-end sm:space-x-5">
              <div className="flex">
                <Img
                  alt=""
                  src={data.img}
                  className="h-24 w-24 rounded-full ring-4 ring-white sm:h-32 sm:w-32"
                />
              </div>
              <div className="mt-6 sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
                <div className="mt-6 min-w-0 flex-1 sm:hidden 2xl:block">
                  <h1 className="truncate text-2xl font-bold text-gray-900">
                    {data.name}
                  </h1>
                </div>
                <div className="mt-6 flex flex-col justify-stretch space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
                  {/* <button
                      type="button"
                      className="inline-flex justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      <EnvelopeIcon
                        aria-hidden="true"
                        className="-ml-0.5 h-5 w-5 text-gray-400"
                      />
                      Message
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      <PhoneIcon
                        aria-hidden="true"
                        className="-ml-0.5 h-5 w-5 text-gray-400"
                      />
                      Call
                    </button> */}
                </div>
              </div>
            </div>
            <div className="mt-6 hidden min-w-0 flex-1 sm:block 2xl:hidden">
              <h1 className="truncate text-2xl font-bold text-gray-900">
                {data.name}
              </h1>
            </div>
          </div>
        </div>

        {/* Description list */}
        <div className="mx-auto mt-6 max-w-5xl px-4 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            {/* {Object.keys(profile.fields).map((field) => (
                <div key={field} className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">{field}</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile.fields[field]}
                  </dd>
                </div>
              ))} */}
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">About</dt>
              <dd className="mt-1 max-w-prose space-y-5 text-sm text-gray-900">
                {data.description}
              </dd>
            </div>
          </dl>
        </div>

        <UpcomingShows comicId={comicId} />

        {/* <AlongsideComics comicId={comicId} /> */}
      </div>
    </div>
  );
}
