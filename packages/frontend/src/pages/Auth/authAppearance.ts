/**
 * Clerk auth widget theming for the "vintage marquee" system.
 * Shared between SignIn and SignUp pages.
 *
 * Colors reference theme.css runtime CSS vars so they flip automatically in
 * dark mode. Card chrome (border/shadow/padding) is stripped so the widget
 * blends into the PageWrapper surface, and Clerk's header/footer are hidden
 * in favor of the marquee header + "Secured by Clerk" footnote.
 */
export const authAppearance = {
  variables: {
    colorPrimary: "var(--solid)",
    colorPrimaryForeground: "var(--on-solid)",
    colorBackground: "var(--surface)",
    colorForeground: "var(--text)",
    colorMutedForeground: "var(--muted)",
    colorInput: "var(--bg)",
    colorInputForeground: "var(--text)",
    colorBorder: "var(--line)",
    colorRing: "#F3C44C",
    borderRadius: "9px",
    fontFamily: "Archivo, system-ui, sans-serif",
  },
  elements: {
    rootBox: "w-full max-w-full",
    cardBox: "w-full border-none! bg-transparent! p-0! shadow-none!",
    card: "border-none! bg-transparent! p-0! shadow-none!",
    header: "hidden",
    footer: "hidden",
    socialButtonsBlockButton:
      "border-hair border-line rounded-field bg-surface hover:bg-track text-text",
    formButtonPrimary: "rounded-pill bg-solid hover:bg-solid-hover",
    dividerLine: "bg-line",
    dividerText: "text-muted font-mono text-meta",
  },
};
