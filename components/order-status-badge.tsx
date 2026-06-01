import {
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
  type OrderStatus,
} from "@/lib/orders";

type OrderStatusBadgeProps = {
  status: OrderStatus;
  size?: "sm" | "md";
};

export function OrderStatusBadge({ status, size = "md" }: OrderStatusBadgeProps) {
  const textSize = size === "sm" ? "text-[10px]" : "text-[11px]";
  const padding = size === "sm" ? "px-2.5 py-0.5" : "px-3 py-1";

  return (
    <span
      className={`inline-flex shrink-0 rounded-full border font-semibold uppercase tracking-wide ${textSize} ${padding} ${getOrderStatusBadgeClass(status)}`}
    >
      {getOrderStatusLabel(status)}
    </span>
  );
}
