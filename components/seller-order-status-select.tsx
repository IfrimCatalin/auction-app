"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { createClient } from "@/lib/supabase/client";
import { ORDER_STATUSES, getOrderStatusLabel, type OrderStatus } from "@/lib/orders";

type SellerOrderStatusSelectProps = {
  orderId: string;
  currentStatus: OrderStatus;
  compact?: boolean;
};

const selectClass =
  "w-full rounded-2xl border border-border bg-page-dark px-4 py-2.5 text-sm text-ink outline-none transition focus:border-accent disabled:opacity-60";

export function SellerOrderStatusSelect({
  orderId,
  currentStatus,
  compact = false,
}: SellerOrderStatusSelectProps) {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = async (nextStatus: OrderStatus) => {
    setErrorMessage("");
    setLoading(true);
    setStatus(nextStatus);

    const { error } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", orderId);

    if (error) {
      setErrorMessage(error.message);
      setStatus(currentStatus);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.refresh();
  };

  return (
    <div className={compact ? "" : "mt-4 rounded-2xl border border-border bg-page p-4"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Order status</p>
        <OrderStatusBadge status={status} size="sm" />
      </div>

      <label className={`block ${compact ? "mt-2" : "mt-3"}`}>
        <span className="sr-only">Update order status</span>
        <select
          value={status}
          disabled={loading}
          onChange={(event) => handleChange(event.target.value as OrderStatus)}
          className={selectClass}
        >
          {ORDER_STATUSES.map((option) => (
            <option key={option} value={option}>
              {getOrderStatusLabel(option)}
            </option>
          ))}
        </select>
      </label>

      {errorMessage ? (
        <p className="mt-2 text-xs text-rose-300">{errorMessage}</p>
      ) : (
        <p className="mt-2 text-xs text-muted">Update status as you fulfill this order.</p>
      )}
    </div>
  );
}
