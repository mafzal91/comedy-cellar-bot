import clsx from "clsx";

/**
 * Cellar stage-photo placeholder banner. Per the vintage-marquee design this is
 * an intentional placeholder (diagonal cream-on-ink stripes), not a real photo.
 * The stripe colors are theme-independent literals — they read as a dark stage
 * wall in both light and dark mode — so they stay inline hex.
 */
export default function ComicBannerImage({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "relative flex h-[14.375rem] items-center justify-center",
        className,
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
  );
}
