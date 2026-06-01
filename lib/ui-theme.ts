/** @deprecated Prefer components/ui and lib/ui-tokens — kept for gradual migration */

export {
  pageShell,
  headerShell,
  navInner,
  navLink,
  container,
  cardBase as card,
  cardHover,
  inputBase,
  sectionMuted,
  headingPage,
  focusRing,
} from "@/lib/ui-tokens";

export { btnPrimary, btnPrimaryLg, btnSecondary, buttonClasses } from "@/lib/button-variants";

export const navLinkPill =
  "hidden rounded-full border border-border bg-elevated px-4 py-2 text-sm font-medium text-ink transition-all hover:border-accent/50 hover:bg-surface sm:inline-flex";
