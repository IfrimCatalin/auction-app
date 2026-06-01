"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAuctionCountdown } from "@/hooks/use-auction-countdown";
import { isListingAuctionClosed } from "@/lib/expire-listings";
import {
  formatBidAmount,
  getBidQuote,
  getMinimumBid,
  type BidHistoryEntry,
} from "@/lib/bids";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { errorBox, successBox } from "@/lib/ui-tokens";

export type BidFormProps = {
  listingId: string;
  currentPrice: number;
  sellerId: string;
  auctionEnd: string;
  bidderId: string;
  listingStatus: string;
  listingIsHidden?: boolean;
  onBidPlaced?: (entry: BidHistoryEntry, newCurrentPrice: number) => void;
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
  onBidPlaced,
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

  const bidQuote = useMemo(() => getBidQuote(currentPrice), [currentPrice]);

  const parsedAmount = useMemo(() => {
    const value = Number(amount);
    return Number.isFinite(value) ? value : null;
  }, [amount]);

  const isBelowMinimum =
    message?.type !== "success" &&
    parsedAmount !== null &&
    parsedAmount + 0.001 < bidQuote.minimumBid;

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

    if (parsedAmount + 0.001 < bidQuote.minimumBid) {
      setMessage({
        type: "error",
        text: `Your bid must be at least ${bidQuote.minimumBidLabel} (minimum increment ${bidQuote.incrementLabel}).`,
      });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("bids")
      .insert({
        listing_id: listingId,
        bidder_id: bidderId,
        amount: parsedAmount,
      })
      .select("id, amount, created_at, bidder_id")
      .single();

    if (error) {
      setMessage({
        type: "error",
        text: friendlyBidError(error.message, bidQuote.minimumBidLabel, bidQuote.incrementLabel),
      });
      setLoading(false);
      return;
    }

    const newCurrentPrice = Number(data.amount);
    const entry: BidHistoryEntry = {
      id: data.id,
      amount: newCurrentPrice,
      created_at: data.created_at,
      bidder_id: data.bidder_id,
      bidderLabel: "You",
    };

    onBidPlaced?.(entry, newCurrentPrice);

    const nextMinimum = getMinimumBid(newCurrentPrice);
    setAmount(nextMinimum.toFixed(2));
    setMessage({
      type: "success",
      text: `Your bid of ${formatBidAmount(newCurrentPrice)} was placed.`,
    });
    setLoading(false);
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (message?.type === "success") {
      setMessage(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <Field
        label="Your bid (USD)"
        htmlFor="bid-amount"
        helper={`Minimum ${bidQuote.minimumBidLabel} · increment ${bidQuote.incrementLabel}`}
      >
        <Input
          id="bid-amount"
          type="number"
          required
          min={bidQuote.minimumBidInput}
          step="0.01"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          disabled={formDisabled || loading}
          placeholder={bidQuote.minimumBidLabel}
          hasError={isBelowMinimum || message?.type === "error"}
        />
      </Field>

      {formDisabled ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {disabledReason}
        </p>
      ) : null}

      {!formDisabled && isBelowMinimum ? (
        <p className={cn(errorBox)} role="alert">
          Enter at least {bidQuote.minimumBidLabel} to place a bid.
        </p>
      ) : null}

      {message ? (
        <p className={message.type === "error" ? errorBox : successBox} role="status">
          {message.text}
        </p>
      ) : null}

      <Button type="submit" fullWidth size="lg" loading={loading} disabled={!canSubmit}>
        Place bid
      </Button>
    </form>
  );
}
