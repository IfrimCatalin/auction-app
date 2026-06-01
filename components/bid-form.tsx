"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAuctionCountdown } from "@/hooks/use-auction-countdown";
import { isListingAuctionClosed } from "@/lib/expire-listings";
import {
  formatBidAmount,
  getBidIncrementForPrice,
  getMinimumBidAmount,
} from "@/lib/bids";
import { createClient } from "@/lib/supabase/client";

export type BidFormProps = {
  listingId: string;
  currentPrice: number;
  sellerId: string;
  auctionEnd: string;
  bidderId: string;
  listingStatus: string;
  listingIsHidden?: boolean;
};

function friendlyBidError(
  raw: string,
  minimumBidLabel: string,
  incrementLabel: string
): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes("tiered minimum increment") ||
    lower.includes("minimum bid:") ||
    lower.includes("increment:")
  ) {
    return `Your bid must be at least ${minimumBidLabel} (minimum increment ${incrementLabel}).`;
  }
  if (lower.includes("higher than current price") || lower.includes("must be higher")) {
    return `Your bid must be at least ${minimumBidLabel} (minimum increment ${incrementLabel}).`;
  }
  if (lower.includes("auction has ended") || lower.includes("has ended")) {
    return "This auction has ended—bidding is closed.";
  }
  if (lower.includes("not active")) {
    return "This listing isn’t accepting bids right now.";
  }
  if (lower.includes("does not exist")) {
    return "This listing could not be found.";
  }
  return raw;
}

export function BidForm({
  listingId,
  currentPrice,
  sellerId,
  auctionEnd,
  bidderId,
  listingStatus,
  listingIsHidden = false,
}: BidFormProps) {
  const supabase = createClient();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const { isEnded: countdownEnded } = useAuctionCountdown(auctionEnd);
  const auctionClosed =
    countdownEnded ||
    isListingAuctionClosed(listingStatus, auctionEnd, Date.now(), listingIsHidden);
  const isSeller = bidderId === sellerId;
  const listingInactive = listingStatus !== "active";
  const formDisabled = auctionClosed || isSeller || listingInactive;

  const disabledReason = auctionClosed
    ? "Auction ended"
    : isSeller
      ? "You can’t bid on your own listing."
      : listingInactive
        ? "This listing isn’t accepting bids right now."
        : "";

  const minimumIncrement = useMemo(
    () => getBidIncrementForPrice(currentPrice),
    [currentPrice]
  );
  const minimumBid = useMemo(() => getMinimumBidAmount(currentPrice), [currentPrice]);
  const minimumBidLabel = useMemo(() => formatBidAmount(minimumBid), [minimumBid]);
  const incrementLabel = useMemo(() => formatBidAmount(minimumIncrement), [minimumIncrement]);
  const minimumBidInput = useMemo(() => minimumBid.toFixed(2), [minimumBid]);

  const parsedAmount = useMemo(() => {
    const value = Number(amount);
    return Number.isFinite(value) ? value : null;
  }, [amount]);

  const isBelowMinimum = parsedAmount !== null && parsedAmount + 0.001 < minimumBid;

  const canSubmit =
    !formDisabled && !loading && parsedAmount !== null && !isBelowMinimum;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (formDisabled) {
      setMessage({ type: "error", text: disabledReason });
      return;
    }

    if (parsedAmount === null || parsedAmount <= 0) {
      setMessage({ type: "error", text: "Enter a valid bid amount." });
      return;
    }

    if (isBelowMinimum) {
      setMessage({
        type: "error",
        text: `Your bid must be at least ${minimumBidLabel} (minimum increment ${incrementLabel}).`,
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("bids").insert({
      listing_id: listingId,
      bidder_id: bidderId,
      amount: parsedAmount,
    });

    if (error) {
      setMessage({
        type: "error",
        text: friendlyBidError(error.message, minimumBidLabel, incrementLabel),
      });
      setLoading(false);
      return;
    }

    setAmount("");
    setMessage({
      type: "success",
      text: `Your bid of ${formatBidAmount(parsedAmount)} was placed.`,
    });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ink/90">Your bid (USD)</span>
        <input
          type="number"
          required
          min={minimumBidInput}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={formDisabled || loading}
          placeholder={minimumBidLabel}
          aria-describedby="bid-minimum-help"
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-accent disabled:cursor-not-allowed disabled:bg-page disabled:text-muted"
        />
        <p id="bid-minimum-help" className="mt-2 text-xs leading-relaxed text-muted">
          Minimum bid:{" "}
          <span className="font-medium text-ink">{minimumBidLabel}</span>
          <span className="text-muted/80"> · Minimum increment: </span>
          <span className="font-medium text-ink">{incrementLabel}</span>
        </p>
      </label>

      {formDisabled ? (
        <p className="rounded-2xl border border-amber-500/30 bg-amber-950/40 px-4 py-3 text-sm text-amber-300">
          {disabledReason}
        </p>
      ) : null}

      {!formDisabled && isBelowMinimum ? (
        <p className="rounded-2xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
          Enter at least {minimumBidLabel} to place a bid.
        </p>
      ) : null}

      {message ? (
        <p
          className={
            message.type === "error"
              ? "rounded-2xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-300"
              : "rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent"
          }
        >
          {message.text}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-full bg-accent px-5 py-3 text-sm font-medium text-black transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Placing bid…" : "Place bid"}
      </button>
    </form>
  );
}
