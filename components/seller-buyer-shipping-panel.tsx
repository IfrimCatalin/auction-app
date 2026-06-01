import { ShippingAddressDisplay } from "@/components/shipping-address-display";
import type { ShippingAddress } from "@/lib/shipping-addresses";

type SellerBuyerShippingPanelProps = {
  address: ShippingAddress | null;
  buyerLabel?: string | null;
  compact?: boolean;
};

export function SellerBuyerShippingPanel({
  address,
  buyerLabel,
  compact = false,
}: SellerBuyerShippingPanelProps) {
  return (
    <div className={compact ? "mt-3" : "mt-5 border-t border-border pt-4"}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        Buyer delivery address
      </p>
      {buyerLabel ? (
        <p className="mt-1 text-xs text-muted">
          Buyer: <span className="font-medium text-ink">{buyerLabel}</span>
        </p>
      ) : null}

      {address ? (
        <div className="mt-2">
          <ShippingAddressDisplay address={address} heading="Ship to" />
        </div>
      ) : (
        <p
          className={`rounded-2xl border border-dashed border-border bg-page text-muted ${
            compact ? "mt-2 px-3 py-2 text-xs" : "mt-3 px-4 py-3 text-sm"
          }`}
        >
          The buyer has not added a delivery address yet. They can add one from their Won
          auctions page.
        </p>
      )}
    </div>
  );
}
