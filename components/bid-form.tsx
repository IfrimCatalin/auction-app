"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type BidFormProps = {
  listingId: string;
  currentPrice: number;
  sellerId: string;
  auctionEnd: string;
  bidderId: string;
  listingStatus: string;
};

function friendlyBidError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("higher than current price") || lower.includes("must be higher")) {
    return "Your bid must be higher than the current price.";
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
}: BidFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const auctionEnded = useMemo(
    () => new Date(auctionEnd).getTime() <= Date.now(),
    [auctionEnd]
  );
  const isSeller = bidderId === sellerId;
  const listingInactive = listingStatus !== "active";
  const formDisabled = auctionEnded || isSeller || listingInactive;

  const disabledReason = auctionEnded
    ? "Bidding is closed because this auction has ended."
    : isSeller
      ? "You can’t bid on your own listing."
      : listingInactive
        ? "This listing isn’t accepting bids right now."
        : "";

  const minimumNext = useMemo(() => (currentPrice + 0.01).toFixed(2), [currentPrice]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (formDisabled) {
      setMessage({ type: "error", text: disabledReason });
      return;
    }

    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setMessage({ type: "error", text: "Enter a valid bid amount." });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("bids").insert({
      listing_id: listingId,
      bidder_id: bidderId,
      amount: parsed,
    });

    if (error) {
      setMessage({
        type: "error",
        text: friendlyBidError(error.message),
      });
      setLoading(false);
      return;
    }

    setAmount("");
    setMessage({
      type: "success",
      text: `Your bid of ${new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(parsed)} was placed.`,
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ink/90">Your bid (USD)</span>
        <input
          type="number"
          required
          min={minimumNext}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={formDisabled || loading}
          placeholder={`Min. ${minimumNext}`}
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-accent disabled:cursor-not-allowed disabled:bg-page disabled:text-muted"
        />
      </label>

      {formDisabled ? (
        <p className="rounded-2xl border border-amber-500/30 bg-amber-950/40 px-4 py-3 text-sm text-amber-300">
          {disabledReason}
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
        disabled={formDisabled || loading}
        className="w-full rounded-full bg-accent px-5 py-3 text-sm font-medium text-black transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Placing bid…" : "Place bid"}
      </button>
    </form>
  );
}
