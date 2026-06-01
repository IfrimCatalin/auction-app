import { OrderStatusBadge } from "@/components/order-status-badge";
import {
  ORDER_PROGRESS_STATUSES,
  getOrderStatusLabel,
  type OrderStatus,
} from "@/lib/orders";

type BuyerOrderStatusTrackerProps = {
  status: OrderStatus;
};

export function BuyerOrderStatusTracker({ status }: BuyerOrderStatusTrackerProps) {
  if (status === "cancelled") {
    return (
      <div className="mt-4 rounded-2xl border border-border bg-page px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Order status</p>
        <div className="mt-2">
          <OrderStatusBadge status={status} />
        </div>
        <p className="mt-2 text-xs text-muted">This order was cancelled.</p>
      </div>
    );
  }

  const currentIndex = ORDER_PROGRESS_STATUSES.indexOf(status);

  return (
    <div className="mt-4 rounded-2xl border border-border bg-page px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Order status</p>
        <OrderStatusBadge status={status} size="sm" />
      </div>

      <ol className="mt-4 space-y-2">
        {ORDER_PROGRESS_STATUSES.map((step, index) => {
          const isComplete = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li key={step} className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  isComplete
                    ? isCurrent
                      ? "bg-accent text-black"
                      : "bg-accent/20 text-accent"
                    : "border border-border bg-page-dark text-muted"
                }`}
                aria-hidden
              >
                {index + 1}
              </span>
              <span
                className={`text-sm ${
                  isCurrent ? "font-semibold text-ink" : isComplete ? "text-ink/80" : "text-muted"
                }`}
              >
                {getOrderStatusLabel(step)}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-xs text-muted">
        Payment processing is not connected yet — the seller updates status manually.
      </p>
    </div>
  );
}
