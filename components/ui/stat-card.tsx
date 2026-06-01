import Link from "next/link";
import { cn } from "@/lib/cn";
import { cardHover } from "@/lib/ui-tokens";

type StatCardProps = {
  label: string;
  value: string | number;
  href?: string;
  highlight?: boolean;
};

export function StatCard({ label, value, href, highlight = false }: StatCardProps) {
  const inner = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p
        className={cn(
          "mt-3 text-4xl font-bold tracking-tight sm:text-5xl",
          highlight ? "text-accent" : "text-ink"
        )}
      >
        {value}
      </p>
    </>
  );

  const className = cn(
    cardHover,
    "block p-6 sm:p-7",
    highlight && "border-accent/40 bg-gradient-to-br from-accent/15 via-surface to-surface ring-accent/20"
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return <article className={className}>{inner}</article>;
}
