import { cn } from "@/lib/cn";

export type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger" | "muted";

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-border bg-elevated text-ink",
  accent: "border-accent/30 bg-accent/10 text-accent",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  danger: "border-red-500/30 bg-red-500/10 text-red-200",
  muted: "border-border bg-page-dark text-muted",
};

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: "sm" | "md";
};

export function Badge({
  variant = "default",
  size = "sm",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-[10px] uppercase tracking-wide" : "px-3 py-1 text-xs",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
