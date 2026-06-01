/** Design tokens — use these on real pages via components/ui */

export const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page";

export const transitionInteractive =
  "transition-all duration-300 ease-out motion-reduce:transition-none";

export const container = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

export const pageShell = "min-h-screen bg-page text-ink";

export const headerShell =
  "sticky top-0 z-40 border-b border-accent/20 bg-page/95 shadow-lg shadow-black/50 backdrop-blur-md";

export const navInner = `${container} flex items-center justify-between gap-3 py-3 sm:py-4`;

export const cardBase =
  "rounded-2xl border border-border/90 bg-surface ring-1 ring-white/5 sm:rounded-3xl";

export const premiumCard =
  `${cardBase} bg-gradient-to-b from-elevated/80 to-surface p-6 sm:p-8`;

export const cardHover = cnPremiumCardHover();

function cnPremiumCardHover() {
  return [
    cardBase,
    "shadow-md shadow-black/40",
    transitionInteractive,
    "motion-safe:hover:-translate-y-1",
    "hover:border-accent/50 hover:shadow-xl hover:shadow-accent/15 hover:ring-accent/30",
  ].join(" ");
}

export const inputBase = [
  "w-full rounded-xl border-2 border-border bg-page-dark px-4 py-3 text-sm text-ink",
  "placeholder:text-muted/70 sm:rounded-2xl",
  focusRing,
  transitionInteractive,
  "hover:border-accent/30",
].join(" ");

export const labelBase = "mb-2 block text-sm font-semibold text-ink";

export const helperText = "mt-1.5 text-xs text-muted";

export const errorText = "mt-1.5 text-xs text-red-300";

export const errorBox =
  "rounded-xl border-2 border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200";

export const successBox =
  "rounded-xl border-2 border-accent/40 bg-accent/15 px-4 py-3 text-sm text-ink";

export const sectionMuted = "text-base text-muted leading-relaxed";

export const headingPage =
  "text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl";

export const headingSection = "text-2xl font-bold tracking-tight text-ink sm:text-3xl";

export const navLink =
  "text-sm font-medium text-muted transition-colors hover:text-accent";

export const navLinkActive =
  "text-sm font-semibold text-accent underline decoration-accent/50 decoration-2 underline-offset-4";
