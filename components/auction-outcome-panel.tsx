import Link from "next/link";
import { ProfileAvatar } from "@/components/profile-avatar";
import { formatBidAmount, type BidHistoryEntry } from "@/lib/bids";
import type { AuctionOutcome } from "@/lib/auction-outcome";
import { formatListingPrice } from "@/lib/listing-price";
import { getProfileDisplayName, type Profile } from "@/lib/profiles";

type AuctionOutcomePanelProps = {
  outcome: AuctionOutcome;
  winningBid: BidHistoryEntry | null;
  finalPrice: number;
  isSeller: boolean;
  isWinner: boolean;
  sellerId: string;
  sellerName: string;
  sellerProfile: Profile | null;
  winnerProfile: Profile | null;
};

function NextStepsPlaceholder() {
  return (
    <p className="mt-4 rounded-xl border border-dashed border-border bg-page px-4 py-3 text-sm text-muted">
      <span className="font-medium text-ink/90">Next steps:</span> Payment and shipping will be
      added soon.
    </p>
  );
}

export function AuctionOutcomePanel({
  outcome,
  winningBid,
  finalPrice,
  isSeller,
  isWinner,
  sellerId,
  sellerName,
  sellerProfile,
  winnerProfile,
}: AuctionOutcomePanelProps) {
  if (outcome === "active") return null;

  if (outcome === "no_bids") {
    return (
      <div className="mt-6 rounded-2xl border border-border bg-page px-4 py-4 text-center sm:px-5 sm:py-5">
        <p className="text-sm font-semibold text-ink">Auction ended with no bids</p>
        <p className="mt-1 text-xs text-muted">This listing did not receive any bids.</p>
      </div>
    );
  }

  if (outcome === "reserve_not_met") {
    return (
      <div className="mt-6 rounded-2xl border border-amber-500/35 bg-amber-950/40 px-4 py-4 text-center sm:px-5 sm:py-5">
        <p className="text-sm font-semibold text-amber-200">Reserve not met — item not sold</p>
        <p className="mt-1 text-xs text-amber-200/80">
          The highest bid did not meet the seller&apos;s reserve price.
        </p>
        {finalPrice > 0 ? (
          <p className="mt-3 text-sm tabular-nums text-amber-100/90">
            High bid: {formatListingPrice(finalPrice)}
          </p>
        ) : null}
      </div>
    );
  }

  if (outcome !== "sold" || !winningBid) return null;

  const winnerName = getProfileDisplayName(winnerProfile, winningBid.bidderLabel);
  const winnerUsername = winnerProfile?.username?.trim();

  if (isWinner) {
    return (
      <div className="mt-6 rounded-2xl border border-accent/40 bg-accent/10 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          You won this auction
        </p>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">
          {formatBidAmount(winningBid.amount)}
        </p>
        <p className="mt-1 text-xs text-muted">
          Winning bid placed {new Date(winningBid.created_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>

        <div className="mt-5 border-t border-accent/20 pt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Seller contact</p>
          <Link
            href={`/seller/${sellerId}`}
            className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-page p-3 transition hover:border-accent/40"
          >
            <ProfileAvatar profile={sellerProfile} size="sm" />
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-semibold text-ink">{sellerName}</p>
              {sellerProfile?.username ? (
                <p className="truncate text-xs text-muted">@{sellerProfile.username}</p>
              ) : null}
              {sellerProfile?.location ? (
                <p className="mt-0.5 truncate text-xs text-muted">{sellerProfile.location}</p>
              ) : null}
            </div>
          </Link>
          <p className="mt-3 text-xs text-muted">
            View the seller&apos;s profile for more details and to coordinate pickup or delivery.
          </p>
        </div>

        <NextStepsPlaceholder />
      </div>
    );
  }

  if (isSeller) {
    return (
      <div className="mt-6 rounded-2xl border border-accent/40 bg-accent/10 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Auction sold</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">
          {formatBidAmount(winningBid.amount)}
        </p>

        <div className="mt-5 border-t border-accent/20 pt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Winning bidder</p>
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-page p-3">
            <ProfileAvatar profile={winnerProfile} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{winnerName}</p>
              {winnerUsername ? (
                <p className="truncate text-xs text-muted">@{winnerUsername}</p>
              ) : (
                <p className="truncate text-xs text-muted">{winningBid.bidderLabel}</p>
              )}
              {winnerProfile?.location ? (
                <p className="mt-0.5 truncate text-xs text-muted">{winnerProfile.location}</p>
              ) : null}
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">
            Coordinate with the buyer to arrange handoff. Profile details are shown from their
            public GoBidMe profile.
          </p>
        </div>

        <NextStepsPlaceholder />
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-page px-4 py-4 sm:px-5 sm:py-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Auction sold</p>
      <p className="mt-2 text-sm font-semibold text-ink">
        Winner: <span className="text-accent">{winningBid.bidderLabel}</span>
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-ink">
        {formatBidAmount(winningBid.amount)}
      </p>
    </div>
  );
}
