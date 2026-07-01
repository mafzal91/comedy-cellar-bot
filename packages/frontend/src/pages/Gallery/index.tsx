import { useState } from "preact/hooks";
import type { ComponentChildren } from "preact";

import { Button } from "../../components/Button";
import { Card, CardHeader, CardBody, CardFooter } from "../../components/Card";
import { Input } from "../../components/Input";
import { Link } from "../../components/Link";
import { Checkbox } from "../../components/Checkbox";
import { Spinner } from "../../components/Spinner";
import { Perforation } from "../../components/Perforation";
import { ThemeToggle } from "../../components/ThemeToggle";

import { Eyebrow } from "../../components/ui/Eyebrow";
import { PageHeader } from "../../components/ui/PageHeader";
import { Pill } from "../../components/ui/Pill";
import { StatusPill } from "../../components/ui/StatusPill";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { SegmentedToggle } from "../../components/ui/SegmentedToggle";
import { Avatar } from "../../components/ui/Avatar";
import { FlameMeter } from "../../components/ui/FlameMeter";
import { TicketStub } from "../../components/ui/TicketStub";
import { TicketCard } from "../../components/ui/TicketCard";
import { SWATCHES } from "../../utils/swatches";

/**
 * Component gallery / kitchen sink — renders every Wave 0B-0D primitive and
 * ui-kit component in the "vintage marquee" style for visual review. Not a
 * production route; a dev preview at /gallery. Flip the bottom-right toggle to
 * check dark mode. Wrapped in a bg-bg surface so the intended page background
 * shows even though the app's screens aren't re-skinned yet.
 */

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ComponentChildren;
}) {
  return (
    <section className="flex flex-col gap-4 border-hair border-line rounded-panel bg-surface p-6 shadow-block-md">
      <div className="flex flex-col gap-1">
        <Eyebrow>{title}</Eyebrow>
        {note ? <p className="font-sans text-caption text-muted">{note}</p> : null}
      </div>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

function Swatch({ bg, fg, i }: { bg: string; fg: string; i: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="grid h-14 w-14 place-items-center rounded-panel border-hair border-line font-display text-lead"
        style={{ background: bg, color: fg }}
      >
        {i + 1}
      </div>
      <span className="font-mono text-meta text-muted">{bg}</span>
    </div>
  );
}

export default function Gallery() {
  const [mode, setMode] = useState<"relaxed" | "compact">("relaxed");
  const [tab, setTab] = useState<"settings" | "profile">("settings");
  const [alerts, setAlerts] = useState(true);
  const [muted, setMuted] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-text">
      <ThemeToggle />

      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
        <PageHeader
          eyebrow="Design System · Wave 0B–0D"
          title="Component Gallery"
          subline={
            <>
              Every re-skinned primitive and ui-kit component.{" "}
              <span className="font-bold text-success">Toggle dark mode</span>{" "}
              bottom-right to check token flips.
            </>
          }
        />

        {/* ---------- Chrome ---------- */}
        <Section title="Chrome · Perforation" note="Ticket-edge strip rendered under the marquee header (already live at the top of this page).">
          <div className="w-full overflow-hidden rounded-card border-hair border-line">
            <Perforation />
          </div>
        </Section>

        {/* ---------- Typography ---------- */}
        <Section title="Typography · Eyebrow + PageHeader">
          <div className="flex flex-col gap-4">
            <Eyebrow>Sunday · June 28, 2026</Eyebrow>
            <PageHeader
              eyebrow="The Lineup"
              title="Meet the Comics"
              subline="Mono eyebrow → Bebas headline → muted subline."
            />
          </div>
        </Section>

        {/* ---------- Buttons ---------- */}
        <Section title="Buttons" note="variant: solid | outline | reserve · size: xs → xl">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="solid">Solid</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="reserve">Reserve Tickets →</Button>
              <Button disabled>Disabled</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="xs">xs</Button>
              <Button size="sm">sm</Button>
              <Button size="md">md</Button>
              <Button size="lg">lg</Button>
              <Button size="xl">xl</Button>
            </div>
          </div>
        </Section>

        {/* ---------- Pills / status ---------- */}
        <Section title="Pills · Status · Progress">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Pill>Generic</Pill>
              <Pill className="border-brand bg-brand text-brand-fg">New</Pill>
              <StatusPill status="available" />
              <StatusPill status="selling-fast" />
              <StatusPill status="sold-out" />
            </div>
            <div className="flex w-72 flex-col gap-3">
              <ProgressBar pct={30} status="available" />
              <ProgressBar pct={70} status="selling-fast" />
              <ProgressBar pct={100} status="sold-out" />
            </div>
          </div>
        </Section>

        {/* ---------- Segmented toggles ---------- */}
        <Section title="SegmentedToggle" note="Controlled — click to switch">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col gap-2">
              <SegmentedToggle<"relaxed" | "compact">
                options={[
                  { label: "Relaxed", value: "relaxed" },
                  { label: "Compact", value: "compact" },
                ]}
                value={mode}
                onChange={setMode}
              />
              <span className="font-mono text-meta text-muted">mode: {mode}</span>
            </div>
            <div className="flex flex-col gap-2">
              <SegmentedToggle<"settings" | "profile">
                options={[
                  { label: "Settings", value: "settings" },
                  { label: "Profile", value: "profile" },
                ]}
                value={tab}
                onChange={setTab}
              />
              <span className="font-mono text-meta text-muted">tab: {tab}</span>
            </div>
          </div>
        </Section>

        {/* ---------- Inputs / form ---------- */}
        <Section title="Input · Checkbox · Link" note="Focus the input to see the 3px yellow offset glow">
          <div className="flex w-full max-w-md flex-col gap-4">
            <Input placeholder="Search by comic name…" />
            <Checkbox
              label="new-show-alerts"
              displayLabel="New Show Alerts"
              description="Email me when new shows are announced."
              checked={alerts}
              onChange={setAlerts}
            />
            <div className="flex items-center gap-4">
              <Link href="#" variant="default">
                Default link
              </Link>
              <Link href="#" variant="underline">
                Create an account
              </Link>
            </div>
          </div>
        </Section>

        {/* ---------- Cards ---------- */}
        <Section title="Card · TicketCard · TicketStub">
          <div className="grid w-full gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <h3 className="font-sans text-lead font-extrabold text-text">Card Header</h3>
              </CardHeader>
              <CardBody>
                <p className="font-sans text-body text-muted">
                  Surface, hairline ink border, block shadow, divided sections.
                </p>
              </CardBody>
              <CardFooter>
                <Button size="sm" variant="reserve">
                  Action →
                </Button>
              </CardFooter>
            </Card>

            <TicketCard>
              <div className="grid grid-cols-[1fr_1fr]">
                <div className="flex flex-col gap-2 p-6">
                  <Eyebrow>Your Show</Eyebrow>
                  <p className="font-display text-d-sm leading-none text-text">
                    Tonight at the Cellar
                  </p>
                  <p className="font-sans text-caption text-muted">
                    Left = TicketCard body.
                  </p>
                </div>
                <TicketStub>
                  <Eyebrow>Ticket Stub</Eyebrow>
                  <p className="mt-2 font-sans text-caption text-muted">
                    Dashed seam + punched notch circles.
                  </p>
                </TicketStub>
              </div>
            </TicketCard>
          </div>
        </Section>

        {/* ---------- Avatars + swatches ---------- */}
        <Section title="Avatar · FlameMeter" note="Avatar swatch is a deterministic hash of the name">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name="Dave Attell" />
              <Avatar name="Nikki Glaser" size={56} />
              <Avatar name="Colin Quinn" size={76} />
              <Avatar name="Comedy Fan" size={100} />
            </div>
            <div className="flex items-center gap-6">
              {[0, 1, 2, 3].map((lvl) => (
                <div key={lvl} className="flex flex-col items-center gap-1">
                  <FlameMeter level={lvl} />
                  <span className="font-mono text-meta text-muted">lvl {lvl}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ---------- Avatar swatch palette ---------- */}
        <Section title="Swatch palette" note="utils/swatches.ts — 6 theme-constant bg/fg pairs">
          <div className="flex flex-wrap gap-4">
            {SWATCHES.map((s, i) => (
              <Swatch key={i} bg={s.bg} fg={s.fg} i={i} />
            ))}
          </div>
        </Section>

        {/* ---------- Spinner ---------- */}
        <Section title="Spinner · notification pills">
          <div className="flex flex-wrap items-center gap-6">
            <Spinner size={5} />
            <Spinner size={8} />
            <Spinner size={10} />
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              className={
                muted
                  ? "rounded-pill border-hair px-3 py-1 font-mono text-meta uppercase tracking-wider text-faint"
                  : "rounded-pill border-hair border-success bg-success-soft px-3 py-1 font-mono text-meta uppercase tracking-wider text-success"
              }
            >
              {muted ? "Muted" : "Enabled"}
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}
