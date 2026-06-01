import {
  getSellerListingSaleLabel,
  sellerListingSaleStatusClass,
  type SellerListingSaleStatus,
} from "@/lib/seller-listing-sale";

type SellerListingSaleBadgeProps = {
  status: SellerListingSaleStatus;
  size?: "sm" | "md";
};

export function SellerListingSaleBadge({ status, size = "md" }: SellerListingSaleBadgeProps) {
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 font-semibold uppercase tracking-wide ${textSize} ${sellerListingSaleStatusClass(status)}`}
    >
      {getSellerListingSaleLabel(status)}
    </span>
  );
}
