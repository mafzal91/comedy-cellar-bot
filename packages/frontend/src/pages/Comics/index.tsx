import { GlobeAltIcon } from "@heroicons/react/20/solid";
import { useQuery } from "react-query";
import { Comic } from "../../types";
import { fetchComics } from "../../utils/api";

function removeSizeFromUrl(url: string): string {
  // Use a regular expression to remove '-70x70' before the file extension
  // return url.replace(/-70x70(?=\.\w+)$/, "");
  return url.replace(/-70x70(?=\.\w+$)/, "");
}

export default function Comics() {
  const { data, isFetching } = useQuery<Comic[]>(
    ["comics"],
    async () => {
      const comics = await fetchComics();

      return comics.results;
    },
    {
      initialData: [],
    }
  );

  if (isFetching) {
    return <div>Fetching</div>;
  }
  return (
    <ul
      role="list"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      {data.map((person) => (
        <li
          key={person.externalId}
          className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow"
        >
          <div className="flex flex-1 flex-col p-8">
            {console.log(removeSizeFromUrl(person.img))}
            <img
              alt=""
              src={removeSizeFromUrl(person.img)}
              className="mx-auto h-32 w-32 flex-shrink-0 rounded-full"
            />
            <h3 className="mt-6 text-sm font-medium text-gray-900">
              {person.name}
            </h3>
            <dl className="mt-1 flex flex-grow flex-col justify-between">
              <dt className="sr-only">Description</dt>
              <dd className="text-sm text-gray-500">{person.description}</dd>
              {/* <dt className="sr-only">Role</dt>
              <dd className="mt-3">
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  {person.role}
                </span>
              </dd> */}
            </dl>
          </div>
          <div>
            <div className="-mt-px flex divide-x divide-gray-200">
              <div className="flex w-0 flex-1">
                <a
                  href={person.website}
                  target="_blank"
                  className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900"
                >
                  <GlobeAltIcon
                    aria-hidden="true"
                    className="h-5 w-5 text-gray-400"
                  />
                  Website
                </a>
              </div>
              {/* <div className="-ml-px flex w-0 flex-1">
                <a
                  href={`tel:${person.telephone}`}
                  className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-gray-900"
                >
                  <PhoneIcon
                    aria-hidden="true"
                    className="h-5 w-5 text-gray-400"
                  />
                  Call
                </a>
              </div> */}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
