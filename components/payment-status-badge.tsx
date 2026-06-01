import {
  getPaymentStatusBadgeClass,
  getPaymentStatusLabel,
  type PaymentStatus,
} from "@/lib/order-payments";

type PaymentStatusBadgeProps = {
  status: PaymentStatus;
  size?: "sm" | "md";
};

export function PaymentStatusBadge({ status, size = "md" }: PaymentStatusBadgeProps) {
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex rounded-full border font-medium ${sizeClass} ${getPaymentStatusBadgeClass(status)}`}
    >
      {getPaymentStatusLabel(status)}
    </span>
  );
}
