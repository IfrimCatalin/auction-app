import { cn } from "@/lib/cn";
import { focusRing, transitionInteractive } from "@/lib/ui-tokens";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base = cn(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold",
  focusRing,
  transitionInteractive,
  "motion-safe:hover:scale-[1.02] active:scale-[0.98] motion-reduce:hover:scale-100",
  "disabled:pointer-events-none disabled:opacity-45"
);

const variants: Record<ButtonVariant, string> = {
  primary: cn(
    "border border-accent-bright/40 bg-gradient-to-r from-accent-bright via-accent to-accent-dim",
    "text-black shadow-lg shadow-accent/35",
    "hover:shadow-xl hover:shadow-accent/50 hover:brightness-110"
  ),
  secondary: cn(
    "border-2 border-border bg-elevated text-ink",
    "hover:border-accent/60 hover:bg-surface hover:text-accent"
  ),
  ghost: "text-muted hover:bg-elevated hover:text-accent",
  danger:
    "border-2 border-red-500/50 bg-red-950/50 text-red-100 hover:border-red-400 hover:bg-red-950",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs sm:text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-base",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
) {
  return cn(base, variants[variant], sizes[size], className);
}

export const btnPrimary = buttonClasses("primary", "md");
export const btnPrimaryLg = buttonClasses("primary", "lg");
export const btnSecondary = buttonClasses("secondary", "md");
