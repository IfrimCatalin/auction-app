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
    return "This listing is not accepting bids right now.";
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
      ? "You cannot bid on your own listing."
      : listingInactive
        ? "This listing is not accepting bids right now."
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
      }).format(parsed)} was placed successfully.`,
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-3">
      <label className="block">
        <span className="mb-2 block text-sm text-slate-300">Bid amount (USD)</span>
        <input
          type="number"
          required
          min={minimumNext}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={formDisabled || loading}
          placeholder={`Min. ${minimumNext}`}
          className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none ring-cyan-300 transition placeholder:text-slate-500 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </label>

      {formDisabled ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {disabledReason}
        </p>
      ) : null}

      {message ? (
        <p
          className={
            message.type === "error"
              ? "rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
              : "rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          }
        >
          {message.text}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={formDisabled || loading}
        className="w-full rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Place bid"}
      </button>
    </form>
  );
}
