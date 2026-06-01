export const PAYMENT_STATUSES = [
  "unpaid",
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export function isPaymentStatus(value: string): value is PaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(value);
}

export function parsePaymentStatus(value: string): PaymentStatus {
  return isPaymentStatus(value) ? value : "unpaid";
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case "unpaid":
      return "Unpaid";
    case "pending":
      return "Payment pending";
    case "paid":
      return "Paid";
    case "failed":
      return "Payment failed";
    case "refunded":
      return "Refunded";
    default:
      return "Unpaid";
  }
}

export function getPaymentStatusBadgeClass(status: PaymentStatus): string {
  switch (status) {
    case "unpaid":
      return "border-amber-500/35 bg-amber-950/40 text-amber-200";
    case "pending":
      return "border-sky-500/35 bg-sky-950/40 text-sky-200";
    case "paid":
      return "border-accent/40 bg-accent/15 text-accent";
    case "failed":
      return "border-red-500/35 bg-red-950/40 text-red-200";
    case "refunded":
      return "border-border bg-page-dark text-muted";
    default:
      return "border-border bg-page-dark text-muted";
  }
}

export function isOrderPaymentComplete(paymentStatus: PaymentStatus): boolean {
  return paymentStatus === "paid";
}

export function canBuyerPayOrder(options: {
  paymentStatus: PaymentStatus;
  orderStatus: string;
}): boolean {
  if (options.paymentStatus === "paid") return false;
  if (!["unpaid", "pending"].includes(options.paymentStatus)) return false;
  return options.orderStatus === "awaiting_payment" || options.orderStatus === "paid";
}

export function canSellerFulfillOrder(paymentStatus: PaymentStatus): boolean {
  return paymentStatus === "paid";
}
