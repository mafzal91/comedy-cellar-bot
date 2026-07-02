import clsx from "clsx";
import { useState } from "preact/hooks";

const COVER_IMAGES = [
  "/cellar.webp",
  "/ComedyCellar_MacDougalstNYC.jpg",
  "/TheStairs_empty.jpg",
];

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

/**
 * Real cellar stage photo, picked at random from a small pool. Falls back to
 * the diagonal cream-on-ink stripe placeholder if the photo fails to load; on
 * hover the placeholder overlays the photo at reduced opacity.
 */
export default function ComicBannerImage({ className }: { className?: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [src] = useState(
    () => COVER_IMAGES[getRandomInt(COVER_IMAGES.length)],
  );

  return (
    <div
      className={clsx(
        "group relative flex h-[14.375rem] items-center justify-center overflow-hidden",
        className,
      )}
    >
      {!imgFailed && (
        <img
          src={src}
          alt="Comedy Cellar stage"
          loading="lazy"
          onError={() => setImgFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div
        aria-hidden="true"
        className={clsx(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-150",
          imgFailed ? "opacity-100" : "opacity-0 group-hover:opacity-80",
        )}
        style={{
          background: "#231F1A",
          backgroundImage:
            "repeating-linear-gradient(135deg, #2A251F 0 14px, #211D18 14px 28px)",
        }}
      >
        <span
          className="font-mono uppercase text-caption text-[#6F665A]"
          style={{ letterSpacing: "0.16em" }}
        >
          Cellar stage photo
        </span>
      </div>
    </div>
  );
}
