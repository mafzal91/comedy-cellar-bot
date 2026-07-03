import type { ComponentChildren } from "preact";

import { Eyebrow } from "../../components/ui/Eyebrow";

type PageWrapperProps = {
  children: ComponentChildren;
  /** Mono uppercase gold kicker above the heading. */
  eyebrow?: ComponentChildren;
  /** Bebas marquee heading (rendered at text-d-lg / ~46px). */
  title?: ComponentChildren;
  /** Muted supporting line under the heading. */
  subline?: ComponentChildren;
  /** Body line rendered below the card (e.g. the "Create an account" link). */
  footer?: ComponentChildren;
  /** Mono footnote below the card (e.g. "Secured by Clerk"). */
  footnote?: ComponentChildren;
};

/**
 * Centered "ticket booth" wrapper for the auth screens. When any of the chrome
 * props are supplied it renders the marquee header, a bordered surface card that
 * slots the auth widget, plus the footer link + footnote. With no chrome props it
 * falls back to the original plain centered wrapper (still used by the Profile page).
 */
export default function PageWrapper({
  children,
  eyebrow,
  title,
  subline,
  footer,
  footnote,
}: PageWrapperProps) {
  const hasChrome = Boolean(eyebrow || title || subline || footer || footnote);

  if (!hasChrome) {
    return <div className="mt-10 flex justify-center">{children}</div>;
  }

  const hasHeader = Boolean(eyebrow || title || subline);

  return (
    <div className="flex min-h-[calc(100vh-180px)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full">
        {hasHeader ? (
          <div className="mb-6 text-center">
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
            {title ? (
              <h1 className="mt-2 font-display text-d-lg tracking-tightcap text-text">
                {title}
              </h1>
            ) : null}
            {subline ? (
              <p className="mt-1.5 font-sans text-body text-muted">{subline}</p>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-2xl border-hair border-line bg-surface px-4 py-6 pb-6 shadow-block-lg sm:px-7">
          {children}
        </div>

        {footer ? (
          <p className="mt-4 text-center font-sans text-body text-muted">{footer}</p>
        ) : null}

        {footnote ? (
          <p className="mt-5 text-center font-mono text-meta tracking-wide text-faint">
            {footnote}
          </p>
        ) : null}
      </div>
    </div>
  );
}
