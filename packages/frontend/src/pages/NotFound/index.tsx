import { Eyebrow } from "../../components/ui/Eyebrow";
import { Link } from "../../components/Link";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6">
      <div className="flex flex-col items-center text-center">
        <Eyebrow>Error 404</Eyebrow>
        <h1 className="mt-2 font-display text-d-lg leading-none tracking-tightcap text-text sm:text-d-xl">
          Lost your ticket?
        </h1>
        <p className="mt-4 max-w-md font-sans text-body leading-relaxed text-muted">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
        <div className="mt-8">
          <Link href="/" variant="underline">
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
}
