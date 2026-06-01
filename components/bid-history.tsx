import {
  formatBidAmount,
  formatBidPlacedAt,
  formatBidTimestamp,
  getAuctionWinner,
  getWinningBid,
  type BidHistoryEntry,
} from "@/lib/bids";
import type { ListingReserveStatus } from "@/lib/reserve-price";

type BidHistoryProps = {
  bids: BidHistoryEntry[];
  isEnded?: boolean;
  reserveStatus?: ListingReserveStatus;
  highlightBidId?: string | null;
};

export function BidHistory({
  bids,
  isEnded = false,
  reserveStatus = "no_reserve",
  highlightBidId = null,
}: BidHistoryProps) {
  const winningBid = getAuctionWinner(bids, reserveStatus, isEnded);
  const leadingBid = getWinningBid(bids);
  const winningBidId = winningBid?.id ?? null;

  return (
    <div className="mt-6 border-t border-border pt-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight text-ink">Bid history</h2>
        {bids.length > 0 ? (
          <span className="text-xs text-muted">
            {bids.length} {bids.length === 1 ? "bid" : "bids"}
          </span>
        ) : null}
      </div>

      {bids.length === 0 && !isEnded ? (
        <p className="mt-4 rounded-2xl border border-border bg-page px-4 py-3 text-sm text-muted">
          No bids yet. Be the first to place a bid.
        </p>
      ) : null}

      {!isEnded && leadingBid ? (
        <div className="mt-4 rounded-2xl border border-accent/35 bg-accent/10 px-4 py-3 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Highest bid
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
            <p className="truncate text-sm font-semibold text-ink">{leadingBid.bidderLabel}</p>
            <p className="text-lg font-semibold tabular-nums text-accent">
              {formatBidAmount(leadingBid.amount)}
            </p>
          </div>
        </div>
      ) : null}

      {bids.length > 0 ? (
        <ul
          className={`max-h-[min(420px,50vh)] space-y-2 overflow-y-auto pr-0.5 sm:max-h-[480px] ${
            isEnded ? "mt-4" : "mt-4"
          }`}
        >
          {bids.map((bid, index) => {
            const isLatest = index === 0;
            const isWinner = winningBidId === bid.id;
            const isFlashing = highlightBidId === bid.id;

            return (
              <li
                key={bid.id}
                className={`rounded-2xl border px-4 py-3 transition-colors ${
                  isFlashing
                    ? "bid-row-flash border-accent/50 bg-accent/10"
                    : isWinner
                      ? "border-accent/40 bg-accent/10"
                      : isLatest && !isEnded
                        ? "border-accent/35 bg-accent/5"
                        : "border-border bg-page"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-ink">{bid.bidderLabel}</p>
                      {isWinner ? (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-black">
                          Winner
                        </span>
                      ) : isLatest && !isEnded ? (
                        <span className="rounded-full border border-border bg-elevated px-2 py-0.5 text-[10px] font-medium text-muted">
                          Latest
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      <span className="font-medium text-ink/80">Bid placed</span>
                      {" · "}
                      <span title={formatBidPlacedAt(bid.created_at)}>
                        {formatBidTimestamp(bid.created_at)}
                      </span>
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-base font-semibold tabular-nums sm:text-right ${
                      isWinner || (isLatest && !isEnded) ? "text-accent" : "text-ink"
                    }`}
                  >
                    {formatBidAmount(bid.amount)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
