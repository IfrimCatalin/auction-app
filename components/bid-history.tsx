import {
  formatBidAmount,
  formatBidPlacedAt,
  formatBidTimestamp,
  getAuctionWinner,
  type BidHistoryEntry,
} from "@/lib/bids";
import type { ListingReserveStatus } from "@/lib/reserve-price";

type BidHistoryProps = {
  bids: BidHistoryEntry[];
  isEnded?: boolean;
  reserveStatus?: ListingReserveStatus;
};

export function BidHistory({
  bids,
  isEnded = false,
  reserveStatus = "no_reserve",
}: BidHistoryProps) {
  const winningBid = getAuctionWinner(bids, reserveStatus, isEnded);
  const winningBidId = winningBid?.id ?? null;
  const reserveBlocked = isEnded && reserveStatus === "reserve_not_met";

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

      {isEnded ? (
        <div className="mt-4">
          {reserveBlocked ? (
            <div className="rounded-2xl border border-amber-500/35 bg-amber-950/40 px-4 py-4 text-center sm:px-5">
              <p className="text-sm font-semibold text-amber-200">
                Reserve not met — no winner
              </p>
              <p className="mt-1 text-xs text-amber-200/80">
                The highest bid did not meet the seller&apos;s reserve.
              </p>
            </div>
          ) : winningBid ? (
            <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                Winning bid
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Winner
                  </p>
                  <p className="mt-0.5 truncate text-lg font-semibold text-ink">
                    {winningBid.bidderLabel}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Placed {formatBidPlacedAt(winningBid.created_at)}
                  </p>
                </div>
                <p className="text-2xl font-semibold tabular-nums text-accent sm:text-right">
                  {formatBidAmount(winningBid.amount)}
                </p>
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-border bg-page px-4 py-4 text-center text-sm text-muted">
              No bids placed
            </p>
          )}
        </div>
      ) : null}

      {bids.length === 0 && !isEnded ? (
        <p className="mt-4 rounded-2xl border border-border bg-page px-4 py-3 text-sm text-muted">
          No bids yet. Be the first to place a bid.
        </p>
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

            return (
              <li
                key={bid.id}
                className={`rounded-2xl border px-4 py-3 ${
                  isWinner
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
