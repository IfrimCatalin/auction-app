import { formatBidTimestamp, type BidHistoryEntry } from "@/lib/bids";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

type BidHistoryProps = {
  bids: BidHistoryEntry[];
};

export function BidHistory({ bids }: BidHistoryProps) {
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

      {bids.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-border bg-page px-4 py-3 text-sm text-muted">
          No bids yet. Be the first to place a bid.
        </p>
      ) : (
        <ul className="mt-4 max-h-[min(420px,50vh)] space-y-2 overflow-y-auto pr-0.5 sm:max-h-[480px]">
          {bids.map((bid, index) => {
            const isLatest = index === 0;

            return (
              <li
                key={bid.id}
                className={`rounded-2xl border px-4 py-3 ${
                  isLatest
                    ? "border-accent/35 bg-accent/5"
                    : "border-border bg-page"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{bid.bidderLabel}</p>
                    <p className="mt-0.5 text-xs text-muted">{formatBidTimestamp(bid.created_at)}</p>
                  </div>
                  <p
                    className={`shrink-0 text-base font-semibold tabular-nums ${
                      isLatest ? "text-accent" : "text-ink"
                    }`}
                  >
                    {formatPrice(bid.amount)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
