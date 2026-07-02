export const Act = ({ name, website, description, img }) => {
  return (
    <>
      <div className="flex-none flex-col items-center justify-center">
        <img
          className="size-10 rounded-full border-hair border-line bg-track object-cover"
          src={img}
          alt={`Image of ${name}`}
        />
      </div>
      <div className="min-w-0 flex-auto">
        <a
          href={website}
          target={"_blank"}
          rel="noopener noreferrer"
          className="font-sans text-caption font-semibold text-text hover:underline"
        >
          {name}
        </a>
        <p className="mt-1 font-mono text-meta capitalize text-muted">
          {description}
        </p>
      </div>
    </>
  );
};
