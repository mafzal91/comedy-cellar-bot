import { FunctionalComponent } from "preact";

/**
 * Ticket-edge motif: a thin dark ink band with a repeating dotted yellow
 * pattern, evoking the perforated tear-line along a ticket stub.
 *
 * brand (#F3C44C) and ink (#1A1714) are theme-constant, so hardcoding them
 * here (per the design spec) is correct — they do not flip in dark mode.
 */
export const Perforation: FunctionalComponent = () => {
  return (
    <div
      aria-hidden="true"
      className="h-3.5 w-full"
      style={{
        background: "#1A1714",
        backgroundImage:
          "radial-gradient(circle at center, #F3C44C 2.2px, transparent 2.8px)",
        backgroundSize: "20px 14px",
      }}
    />
  );
};
