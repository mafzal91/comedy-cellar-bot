export const Act = ({ name, website, description, img }) => {
  return (
    <>
      <div className="flex-col flex-none items-center justify-center">
        <img
          className="h-10 w-10 rounded-full bg-gray-50"
          src={img}
          alt={`Image of ${name}`}
        />
      </div>
      <div className="min-w-0 flex-auto">
        <a
          href={website}
          target={"_blank"}
          rel="noopener noreferrer"
          className="text-sm font-semibold leading-6 text-gray-900"
        >
          {name}
        </a>
        <p className="mt-1 text-xs leading-5 text-gray-500 capitalize">
          {description}
        </p>
      </div>
    </>
  );
};
