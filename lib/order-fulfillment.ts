import type { OrderStatus } from "@/lib/orders";
import type { PaymentStatus } from "@/lib/order-payments";
import { isOrderPaymentComplete } from "@/lib/order-payments";

export type OrderShippingInfo = {
  trackingNumber: string | null;
  shippingCarrier: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
};

export function canSellerMarkPreparingShipment(
  status: OrderStatus,
  paymentStatus: PaymentStatus
): boolean {
  return isOrderPaymentComplete(paymentStatus) && status === "paid";
}

export function canSellerMarkShipped(
  status: OrderStatus,
  paymentStatus: PaymentStatus
): boolean {
  return isOrderPaymentComplete(paymentStatus) && status === "preparing_shipment";
}

export function canBuyerConfirmDelivery(status: OrderStatus): boolean {
  return status === "shipped";
}

export function hasShipmentTracking(info: OrderShippingInfo): boolean {
  return Boolean(info.trackingNumber?.trim() && info.shippingCarrier?.trim());
}

export function formatShipmentDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
