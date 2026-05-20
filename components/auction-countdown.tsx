"use client";

import { useAuctionCountdown } from "@/hooks/use-auction-countdown";

type AuctionCountdownProps = {
  auctionEnd: string;
  size?: "sm" | "lg";
  className?: string;
};

function sizeClasses(size: "sm" | "lg", isEndingSoon: boolean, isEnded: boolean) {
  if (size === "lg") {
    if (isEnded) {
      return "rounded-2xl border border-border bg-page px-4 py-3 text-base font-semibold text-muted";
    }
    if (isEndingSoon) {
      return "rounded-2xl border border-accent/50 bg-accent/10 px-4 py-3 text-base font-semibold text-accent";
    }
    return "rounded-2xl border border-border bg-page px-4 py-3 text-base font-semibold text-ink";
  }

  if (isEnded) {
    return "text-xs font-medium text-muted";
  }
  if (isEndingSoon) {
    return "rounded-full border border-accent/40 bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent";
  }
  return "text-xs font-medium text-muted";
}

export function AuctionCountdown({
  auctionEnd,
  size = "sm",
  className = "",
}: AuctionCountdownProps) {
  const { label, isEnded, isEndingSoon } = useAuctionCountdown(auctionEnd);

  return (
    <p
      className={`tabular-nums ${sizeClasses(size, isEndingSoon, isEnded)} ${className}`}
      aria-live="polite"
    >
      {label}
    </p>
  );
}
