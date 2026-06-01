import Link from "next/link";
import { ListingCover } from "@/components/listing-cover";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { SellerBuyerShippingPanel } from "@/components/seller-buyer-shipping-panel";
import { SellerOrderStatusSelect } from "@/components/seller-order-status-select";
import { formatListingPrice } from "@/lib/listing-price";
import type { SellerOrderView } from "@/lib/orders";
import type { ShippingAddress } from "@/lib/shipping-addresses";

type SellerOrderCardProps = {
  sellerOrder: SellerOrderView;
  shippingAddress: ShippingAddress | null;
  compact?: boolean;
};

function formatEndedDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SellerOrderCard({
  sellerOrder,
  shippingAddress,
  compact = false,
}: SellerOrderCardProps) {
  const { order, listingTitle, coverUrl, auctionEndedAt, buyerLabel } = sellerOrder;

  return (
    <article
      className={`overflow-hidden rounded-3xl border border-accent/35 bg-accent/5 ${
        compact ? "" : "transition hover:border-accent/50"
      }`}
    >
      <div className="flex flex-col sm:flex-row">
        <Link
          href={`/auctions/${order.listing_id}`}
          className={`relative shrink-0 overflow-hidden bg-page-dark ${
            compact
              ? "aspect-[4/3] w-full sm:aspect-auto sm:h-auto sm:w-36"
              : "aspect-[4/3] w-full sm:aspect-auto sm:h-auto sm:w-44 md:w-52"
          }`}
        >
          <ListingCover
            src={coverUrl}
            alt={listingTitle}
            className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
          />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link
                href={`/auctions/${order.listing_id}`}
                className="line-clamp-2 text-base font-semibold text-ink transition hover:text-accent"
              >
                {listingTitle}
              </Link>
              <p className="mt-1 text-xs text-muted">Ended {formatEndedDate(auctionEndedAt)}</p>
              <p className="mt-1 text-xs text-muted">
                Buyer: <span className="font-medium text-ink">{buyerLabel}</span>
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-muted">
            Sale price
          </p>
          <p className="text-2xl font-semibold tabular-nums text-accent">
            {formatListingPrice(order.final_price)}
          </p>

          <SellerOrderStatusSelect
            orderId={order.id}
            currentStatus={order.status}
            compact
          />

          <SellerBuyerShippingPanel
            address={shippingAddress}
            buyerLabel={buyerLabel}
            compact
          />

          <Link
            href={`/auctions/${order.listing_id}`}
            className="mt-4 inline-flex w-fit rounded-full border border-border bg-page px-4 py-2 text-sm font-medium text-ink transition hover:border-accent/40"
          >
            View listing
          </Link>
        </div>
      </div>
    </article>
  );
}
