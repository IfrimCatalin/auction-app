"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { buyerConfirmDeliveryAction } from "@/app/orders/actions";
import type { OrderStatus } from "@/lib/orders";
import {
  canBuyerConfirmDelivery,
  formatShipmentDate,
  hasShipmentTracking,
} from "@/lib/order-fulfillment";
import { btnPrimary } from "@/lib/ui-theme";

export type BuyerOrderDeliveryData = {
  orderId: string;
  listingId: string;
  status: OrderStatus;
  trackingNumber: string | null;
  shippingCarrier: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
};

type BuyerOrderDeliveryProps = {
  order: BuyerOrderDeliveryData;
};

export function BuyerOrderDelivery({ order }: BuyerOrderDeliveryProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const tracking = hasShipmentTracking({
    trackingNumber: order.trackingNumber,
    shippingCarrier: order.shippingCarrier,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
  });

  const canConfirm = canBuyerConfirmDelivery(order.status);
  const isDelivered = order.status === "delivered";

  if (order.status === "awaiting_payment" || order.status === "paid" || order.status === "preparing_shipment") {
    return null;
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-page px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Shipment</p>

      {tracking ? (
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-xs text-muted">Carrier</dt>
            <dd className="font-medium text-ink">{order.shippingCarrier}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Tracking number</dt>
            <dd className="font-mono text-ink">{order.trackingNumber}</dd>
          </div>
          {order.shippedAt ? (
            <div>
              <dt className="text-xs text-muted">Shipped</dt>
              <dd className="text-ink">{formatShipmentDate(order.shippedAt)}</dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="mt-2 text-sm text-muted">Tracking details will appear once the seller ships.</p>
      )}

      {isDelivered ? (
        <p className="mt-4 text-sm text-emerald-200/90">
          Delivered{order.deliveredAt ? ` · ${formatShipmentDate(order.deliveredAt)}` : ""}. You can
          leave a review on the{" "}
          <Link href={`/auctions/${order.listingId}`} className="text-accent hover:underline">
            auction page
          </Link>
          .
        </p>
      ) : canConfirm ? (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-muted">
            Confirm when you receive the item so the seller knows delivery is complete.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setMessage(null);
              startTransition(async () => {
                const result = await buyerConfirmDeliveryAction(order.orderId);
                if (!result.ok) {
                  setMessage({ type: "error", text: result.error ?? "Could not confirm delivery." });
                  return;
                }
                setMessage({ type: "success", text: "Delivery confirmed. Thank you!" });
                router.refresh();
              });
            }}
            className={`${btnPrimary} w-full sm:w-auto`}
          >
            {pending ? "Confirming…" : "Confirm delivery"}
          </button>
        </div>
      ) : null}

      {message ? (
        <p
          className={`mt-3 text-xs ${
            message.type === "success" ? "text-emerald-200" : "text-rose-300"
          }`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
