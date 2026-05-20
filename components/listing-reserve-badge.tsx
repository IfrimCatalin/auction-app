import type { ListingReserveStatus } from "@/lib/reserve-price";

type ListingReserveBadgeProps = {
  status: ListingReserveStatus;
  size?: "sm" | "md";
  className?: string;
};

function badgeStyles(status: ListingReserveStatus, size: "sm" | "md") {
  const sizeClass =
    size === "sm"
      ? "px-2 py-0.5 text-[10px]"
      : "px-2.5 py-1 text-[11px]";

  switch (status) {
    case "no_reserve":
      return `${sizeClass} border border-accent/40 bg-accent/10 font-semibold uppercase tracking-wide text-accent`;
    case "reserve_met":
      return `${sizeClass} bg-accent font-semibold uppercase tracking-wide text-black`;
    case "reserve_not_met":
      return `${sizeClass} border border-amber-500/40 bg-amber-950/50 font-semibold uppercase tracking-wide text-amber-300`;
  }
}

function badgeLabel(status: ListingReserveStatus) {
  switch (status) {
    case "no_reserve":
      return "No Reserve";
    case "reserve_met":
      return "Reserve met";
    case "reserve_not_met":
      return "Reserve not met";
  }
}

export function ListingReserveBadge({
  status,
  size = "sm",
  className = "",
}: ListingReserveBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full ${badgeStyles(status, size)} ${className}`}
    >
      {badgeLabel(status)}
    </span>
  );
}
