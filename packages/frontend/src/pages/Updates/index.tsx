import clsx from "clsx";

import { PageHeader } from "../../components/ui/PageHeader";
import { Pill } from "../../components/ui/Pill";
import { updates } from "./data";

export default function Updates() {
  // data.ts carries no `isNew` flag, so the marquee "New" accent is derived
  // purely for display from the newest date group (does not alter data wiring).
  const newestDate = updates[0]?.date;

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="mx-auto max-w-[760px] px-6 pt-9 pb-[70px]">
        <PageHeader
          eyebrow="Changelog"
          title="What's New"
          subline="Fresh features and fixes from backstage."
        />

        {/* timeline */}
        <div className="relative mt-9 pl-[34px]">
          {/* dashed left rail */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[6px] top-[6px] bottom-[6px] border-l-2 border-dashed border-line"
          />

          {updates.map((update, index) => {
            const isNew = update.date === newestDate;
            return (
              <div key={index} className="relative mb-[18px]">
                {/* node dot on the rail */}
                <div
                  aria-hidden="true"
                  className={clsx(
                    "absolute left-[-34px] top-4 size-[0.875rem] rounded-full border-hair border-line",
                    isNew ? "bg-brand" : "bg-surface",
                  )}
                />

                <div className="rounded-xl border-hair border-line bg-surface px-5 py-4 shadow-block transition-all duration-150 ease-out hover:-translate-x-px hover:-translate-y-px hover:shadow-block-lg">
                  <div className="mb-1.5 flex items-center gap-2.5">
                    <span className="font-mono text-meta uppercase tracking-wider text-gold">
                      {update.date}
                    </span>
                    {isNew ? (
                      <Pill className="border-brand bg-brand text-brand-fg">
                        New
                      </Pill>
                    ) : null}
                  </div>

                  <h3 className="mb-1.5 font-sans text-lg font-extrabold text-text">
                    {update.title}
                  </h3>

                  <p className="font-sans text-caption leading-relaxed text-muted">
                    {update.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
