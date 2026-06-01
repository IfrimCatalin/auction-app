"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  sellerMarkPreparingShipmentAction,
  sellerMarkShippedAction,
} from "@/app/(authenticated)/orders/actions";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import type { Order } from "@/lib/orders";
import {
  canSellerMarkPreparingShipment,
  canSellerMarkShipped,
} from "@/lib/order-fulfillment";
import { btnPrimary, inputBase } from "@/lib/ui-theme";

type SellerOrderFulfillmentProps = {
  order: Order;
  compact?: boolean;
};

export function SellerOrderFulfillment({ order, compact = false }: SellerOrderFulfillmentProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number ?? "");
  const [shippingCarrier, setShippingCarrier] = useState(order.shipping_carrier ?? "");

  const canPrepare = canSellerMarkPreparingShipment(order.status, order.payment_status);
  const canShip = canSellerMarkShipped(order.status, order.payment_status);
  const isDelivered = order.status === "delivered";
  const isShipped = order.status === "shipped";

  function run(action: () => Promise<{ ok: boolean; error?: string }>, successText: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setMessage({ type: "error", text: result.error ?? "Action failed." });
        return;
      }
      setMessage({ type: "success", text: successText });
      router.refresh();
    });
  }

  return (
    <div className={compact ? "mt-4" : "mt-4 rounded-2xl border border-border bg-page p-4"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Fulfillment</p>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.status} size="sm" />
          <PaymentStatusBadge status={order.payment_status} size="sm" />
        </div>
      </div>

      {!canPrepare && order.payment_status !== "paid" && order.status === "awaiting_payment" ? (
        <p className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Awaiting buyer payment before you can prepare shipment.
        </p>
      ) : null}

      {canPrepare ? (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(
              () => sellerMarkPreparingShipmentAction(order.id),
              "Marked as preparing shipment."
            )
          }
          className={`${btnPrimary} mt-3 w-full sm:w-auto`}
        >
          Mark preparing shipment
        </button>
      ) : null}

      {canShip ? (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-muted">
            Add tracking details, then mark the order as shipped.
          </p>
          <div>
            <label htmlFor={`carrier-${order.id}`} className="mb-1.5 block text-xs font-medium text-ink">
              Carrier
            </label>
            <input
              id={`carrier-${order.id}`}
              value={shippingCarrier}
              onChange={(e) => setShippingCarrier(e.target.value)}
              disabled={pending}
              placeholder="USPS, UPS, FedEx…"
              className={inputBase}
            />
          </div>
          <div>
            <label htmlFor={`tracking-${order.id}`} className="mb-1.5 block text-xs font-medium text-ink">
              Tracking number
            </label>
            <input
              id={`tracking-${order.id}`}
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              disabled={pending}
              placeholder="Tracking number"
              className={inputBase}
            />
          </div>
          <button
            type="button"
            disabled={pending || !trackingNumber.trim() || !shippingCarrier.trim()}
            onClick={() =>
              run(
                () =>
                  sellerMarkShippedAction(
                    order.id,
                    trackingNumber.trim(),
                    shippingCarrier.trim()
                  ),
                "Order marked as shipped."
              )
            }
            className={`${btnPrimary} w-full sm:w-auto`}
          >
            Mark as shipped
          </button>
        </div>
      ) : null}

      {isShipped || isDelivered ? (
        <div className="mt-3 rounded-2xl border border-border bg-page-dark/60 px-3 py-3 text-sm">
          {order.shipping_carrier && order.tracking_number ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Shipment</p>
              <p className="mt-1 text-ink">
                {order.shipping_carrier} · <span className="font-mono">{order.tracking_number}</span>
              </p>
            </>
          ) : null}
          {order.shipped_at ? (
            <p className="mt-1 text-xs text-muted">
              Shipped {new Date(order.shipped_at).toLocaleString()}
            </p>
          ) : null}
          {isDelivered && order.delivered_at ? (
            <p className="mt-1 text-xs text-emerald-200/90">
              Delivered {new Date(order.delivered_at).toLocaleString()}
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted">Waiting for buyer delivery confirmation.</p>
          )}
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
