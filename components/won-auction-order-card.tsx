import Link from "next/link";
import { BuyerOrderStatusTracker } from "@/components/buyer-order-status-tracker";
import { ListingCover } from "@/components/listing-cover";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ShippingAddressForm } from "@/components/shipping-address-form";
import { formatListingPrice } from "@/lib/listing-price";
import type { BuyerOrderView } from "@/lib/orders";

type WonAuctionOrderCardProps = {
  order: BuyerOrderView;
  userId: string;
  sellerProfile: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

function formatEndedDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function WonAuctionOrderCard({ order, userId, sellerProfile }: WonAuctionOrderCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-surface transition hover:border-accent/30">
      <div className="flex flex-col sm:flex-row">
        <Link
          href={`/auctions/${order.listingId}`}
          className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-page-dark sm:aspect-auto sm:h-auto sm:w-44 md:w-52"
        >
          <ListingCover
            src={order.coverUrl}
            alt={order.title}
            className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
          />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link
                href={`/auctions/${order.listingId}`}
                className="line-clamp-2 text-base font-semibold text-ink transition hover:text-accent sm:text-lg"
              >
                {order.title}
              </Link>
              <p className="mt-1 text-xs text-muted">
                Ended {formatEndedDate(order.auctionEndedAt)}
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          <BuyerOrderStatusTracker status={order.status} />

          <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-muted">
            Final price
          </p>
          <p className="text-2xl font-semibold tabular-nums text-accent">
            {formatListingPrice(order.finalPrice)}
          </p>

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Seller</p>
            <Link
              href={`/seller/${order.sellerId}`}
              className="mt-2 flex items-center gap-3 rounded-2xl border border-border bg-page p-3 transition hover:border-accent/40"
            >
              <ProfileAvatar profile={sellerProfile} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{order.sellerName}</p>
                {order.sellerUsername ? (
                  <p className="truncate text-xs text-muted">@{order.sellerUsername}</p>
                ) : null}
              </div>
            </Link>
          </div>

          <ShippingAddressForm
            listingId={order.listingId}
            userId={userId}
            initialAddress={order.shippingAddress}
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/auctions/${order.listingId}`}
              className="rounded-full border border-border bg-page px-4 py-2 text-sm font-medium text-ink transition hover:border-accent/40"
            >
              View auction
            </Link>
            <Link
              href={`/seller/${order.sellerId}`}
              className="rounded-full border border-border bg-page px-4 py-2 text-sm font-medium text-ink transition hover:border-accent/40"
            >
              Seller profile
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
