import Link from "next/link";
import { AuthenticatedSection } from "@/components/authenticated-layout";
import { PageHeader } from "@/components/ui/page-header";
import { SectionTitle } from "@/components/ui/section-title";
import { StatCard } from "@/components/ui/stat-card";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { unstable_noStore as noStore } from "next/cache";
import { formatListingPrice, getListingDisplayPrice } from "@/lib/listing-price";
import { ListingCover } from "@/components/listing-cover";
import { cardHover } from "@/lib/ui-tokens";
import { cn } from "@/lib/cn";
import {
  getCoverImageUrl,
  LISTING_IMAGES_SELECT,
  type ListingImageRow,
} from "@/lib/listing-images";
import { getWatchlistCount } from "@/lib/favorites";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { SellerOrderCard } from "@/components/seller-order-card";
import { getBuyerOrders, getSellerOrders } from "@/lib/orders";
import { getShippingAddressesByListingIds } from "@/lib/shipping-addresses";
import { expirePastDueListings } from "@/lib/expire-listings";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type MyListing = {
  id: string;
  title: string;
  category: string;
  current_price: number;
  status: string;
  image_url: string | null;
  listing_images: ListingImageRow[] | null;
  bids: { amount: number }[] | null;
};

export default async function DashboardPage() {
  noStore();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  await expirePastDueListings(supabase);

  const { data: listingsData } = await supabase
    .from("listings")
    .select(
      `id, title, category, current_price, status, image_url, listing_images (${LISTING_IMAGES_SELECT}), bids ( amount )`
    )
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const myListings = (listingsData ?? []) as MyListing[];
  const watchlistCount = await getWatchlistCount(supabase, user.id);
  const unreadNotificationCount = await getUnreadNotificationCount(supabase, user.id);
  const [wonOrders, sellerOrders] = await Promise.all([
    getBuyerOrders(supabase, user.id),
    getSellerOrders(supabase, user.id),
  ]);
  const recentSellerOrders = sellerOrders.slice(0, 3);
  const shippingByListingId = await getShippingAddressesByListingIds(
    supabase,
    recentSellerOrders.map((item) => item.order.listing_id)
  );

  return (
    <AuthenticatedSection>
      <PageHeader
        eyebrow="Dashboard"
        title={user.email?.split("@")[0] ?? "Dashboard"}
        description={
          unreadNotificationCount > 0
            ? `Signed in as ${user.email} · ${unreadNotificationCount} unread notification${unreadNotificationCount === 1 ? "" : "s"}.`
            : `Signed in as ${user.email}`
        }
        actions={<ButtonLink href="/create-listing">Sell an item</ButtonLink>}
      />

      <section className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-5">
        <StatCard label="Won auctions" value={wonOrders.length} href="/orders" highlight />
        <StatCard label="Sold orders" value={sellerOrders.length} href="/my-listings" />
        <StatCard label="Active bids" value={12} />
        <StatCard label="Watchlist" value={watchlistCount} href="/watchlist" />
        <StatCard
          label="Unread alerts"
          value={unreadNotificationCount}
          href="/notifications"
          highlight={unreadNotificationCount > 0}
        />
      </section>

      {recentSellerOrders.length > 0 ? (
        <section className="mt-10">
          <SectionTitle
            title="Recent sales"
            description="Manage order status and buyer shipping."
            action={
              <ButtonLink href="/my-listings" variant="secondary" size="sm">
                View all →
              </ButtonLink>
            }
          />
          <ul className="space-y-4">
            {recentSellerOrders.map((sellerOrder) => (
              <li key={sellerOrder.order.id}>
                <SellerOrderCard
                  sellerOrder={sellerOrder}
                  shippingAddress={
                    shippingByListingId.get(sellerOrder.order.listing_id) ?? null
                  }
                  compact
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10">
        <SectionTitle
          title="Your listings"
          description="Items you've listed for auction."
          action={
            <div className="flex flex-wrap gap-2">
              <ButtonLink href="/my-listings" variant="secondary" size="sm">
                View all
              </ButtonLink>
              <ButtonLink href="/create-listing" size="sm">
                Create listing
              </ButtonLink>
            </div>
          }
        />

        {myListings.length === 0 ? (
          <EmptyState
            title="No listings yet"
            description="List your first item and start receiving bids."
            actionLabel="Create listing"
            actionHref="/create-listing"
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {myListings.map((listing) => {
              const coverUrl = getCoverImageUrl(listing.image_url, listing.listing_images);
              const displayPrice = getListingDisplayPrice(listing.current_price, listing.bids);

              return (
                <Link
                  key={listing.id}
                  href={`/auctions/${listing.id}`}
                  className={cn("group block overflow-hidden", cardHover)}
                >
                  <div className="aspect-square w-full overflow-hidden bg-page-dark">
                    <ListingCover
                      src={coverUrl}
                      alt={listing.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="border-t border-border/80 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent/80">
                      {listing.category}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-base font-bold text-ink group-hover:text-accent">
                      {listing.title}
                    </h3>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                          Current bid
                        </p>
                        <p className="text-lg font-bold tabular-nums text-ink">
                          {formatListingPrice(displayPrice)}
                        </p>
                      </div>
                      <span className="rounded-full border border-border bg-page-dark px-3 py-1 text-[11px] font-medium text-muted">
                        {listing.status}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </AuthenticatedSection>
  );
}
