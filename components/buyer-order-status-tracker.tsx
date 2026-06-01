import { OrderStatusBadge } from "@/components/order-status-badge";
import {
  ORDER_PROGRESS_STATUSES,
  getOrderStatusLabel,
  type OrderStatus,
} from "@/lib/orders";
import { cn } from "@/lib/cn";
import { cardBase } from "@/lib/ui-tokens";

type BuyerOrderStatusTrackerProps = {
  status: OrderStatus;
};

export function BuyerOrderStatusTracker({ status }: BuyerOrderStatusTrackerProps) {
  if (status === "cancelled") {
    return (
      <div className={cn(cardBase, "mt-4 bg-page px-4 py-4 sm:px-5")}>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Order status</p>
        <div className="mt-2">
          <OrderStatusBadge status={status} />
        </div>
        <p className="mt-2 text-xs text-muted">This order was cancelled.</p>
      </div>
    );
  }

  const currentIndex = ORDER_PROGRESS_STATUSES.indexOf(status);

  return (
    <div className={cn(cardBase, "mt-4 bg-page px-4 py-4 sm:px-5")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Order progress</p>
        <OrderStatusBadge status={status} size="sm" />
      </div>

      {/* Desktop / tablet: horizontal stepper */}
      <ol className="mt-5 hidden sm:flex sm:items-start sm:justify-between sm:gap-1">
        {ORDER_PROGRESS_STATUSES.map((step, index) => {
          const isComplete = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <li key={step} className="flex flex-1 flex-col items-center text-center">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                  isComplete
                    ? isCurrent
                      ? "bg-accent text-black shadow-md shadow-accent/20"
                      : "bg-accent/20 text-accent"
                    : "border border-border bg-page-dark text-muted"
                )}
                aria-hidden
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  "mt-2 max-w-[4.5rem] text-[10px] leading-tight sm:max-w-none sm:text-xs",
                  isCurrent ? "font-semibold text-ink" : isComplete ? "text-ink/80" : "text-muted"
                )}
              >
                {getOrderStatusLabel(step)}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Mobile: vertical list */}
      <ol className="mt-4 space-y-2 sm:hidden">
        {ORDER_PROGRESS_STATUSES.map((step, index) => {
          const isComplete = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <li key={step} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  isComplete
                    ? isCurrent
                      ? "bg-accent text-black"
                      : "bg-accent/20 text-accent"
                    : "border border-border bg-page-dark text-muted"
                )}
                aria-hidden
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  "text-sm",
                  isCurrent ? "font-semibold text-ink" : isComplete ? "text-ink/80" : "text-muted"
                )}
              >
                {getOrderStatusLabel(step)}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Pay for your order, then track shipment and confirm delivery when it arrives.
      </p>
    </div>
  );
}
