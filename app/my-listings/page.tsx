import type { Metadata } from "next";
import { GobidMeLogo } from "@/components/gobidme-logo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { formatListingPrice, getListingDisplayPrice } from "@/lib/listing-price";
import { ListingCover } from "@/components/listing-cover";
import { LogoutButton } from "@/components/logout-button";
import { MyListingActions } from "@/components/my-listing-actions";
import {
  getCoverImageUrl,
  getGalleryImageUrls,
  LISTING_IMAGES_SELECT,
  type ListingImageRow,
} from "@/lib/listing-images";
import { SellerListingSaleBadge } from "@/components/seller-listing-sale-badge";
import { getBidderDisplayLabel, getWinningBidFromRows } from "@/lib/bids";
import { expirePastDueListings } from "@/lib/expire-listings";
import {
  getSellerListingSaleStatus,
  type SellerListingSaleStatus,
} from "@/lib/seller-listing-sale";
import { SellerBuyerShippingPanel } from "@/components/seller-buyer-shipping-panel";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { SellerOrderStatusSelect } from "@/components/seller-order-status-select";
import { SellerOrderCard } from "@/components/seller-order-card";
import { getOrdersByListingIds, getSellerOrders } from "@/lib/orders";
import { getShippingAddressesByListingIds } from "@/lib/shipping-addresses";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My Listings",
  description: "Manage your GoBidMe auction listings.",
};

type SellerListing = {
  id: string;
  title: string;
  category: string;
  current_price: number;
  auction_end: string;
  status: string;
  reserve_price: number | null;
  image_url: string | null;
  listing_images: ListingImageRow[] | null;
  bids: { id: string; amount: number; created_at: string; bidder_id: string }[] | null;
};

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getBidCount(listing: SellerListing) {
  return listing.bids?.length ?? 0;
}

function getDisplayPrice(listing: SellerListing) {
  return getListingDisplayPrice(listing.current_price, listing.bids);
}

function priceLabel(saleStatus: SellerListingSaleStatus) {
  return saleStatus === "sold" ? "Sale price" : "Current bid";
}

function getWinnerLabel(
  listing: SellerListing,
  profileById: Map<string, { username: string | null; full_name: string | null }>
) {
  const winner = getWinningBidFromRows(listing.bids);
  if (!winner) return null;
  return getBidderDisplayLabel(profileById.get(winner.bidder_id));
}

export default async function MyListingsPage() {
  noStore();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await expirePastDueListings(supabase);

  const { data, error } = await supabase
    .from("listings")
    .select(
      `id, title, category, current_price, auction_end, status, reserve_price, image_url, listing_images (${LISTING_IMAGES_SELECT}), bids ( id, amount, created_at, bidder_id )`
    )
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const listings = (data ?? []) as SellerListing[];

  const soldListings = listings.filter(
    (listing) => getSellerListingSaleStatus(listing) === "sold"
  );
  const winnerIds = soldListings
    .map((listing) => getWinningBidFromRows(listing.bids)?.bidder_id)
    .filter((id): id is string => Boolean(id));

  const { data: winnerProfiles } =
    winnerIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, username, full_name")
          .in("id", [...new Set(winnerIds)])
      : { data: [] };

  const winnerProfileById = new Map(
    (winnerProfiles ?? []).map((profile) => [
      profile.id as string,
      profile as { username: string | null; full_name: string | null },
    ])
  );

  const sellerOrders = await getSellerOrders(supabase, user.id);
  const soldListingIds = soldListings.map((listing) => listing.id);
  const orderListingIds = sellerOrders.map((item) => item.order.listing_id);
  const allShippingListingIds = [...new Set([...soldListingIds, ...orderListingIds])];

  const [shippingByListingId, ordersByListingId] = await Promise.all([
    getShippingAddressesByListingIds(supabase, allShippingListingIds),
    getOrdersByListingIds(supabase, soldListingIds),
  ]);

  return (
    <main className="min-h-screen bg-page text-ink">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-page/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <GobidMeLogo />
          <div className="flex items-center gap-2">
            <Link
              href="/orders"
              className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-page-dark sm:inline-flex"
            >
              Orders
            </Link>
            <Link
              href="/dashboard"
              className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-page-dark sm:inline-flex"
            >
              Dashboard
            </Link>
            <Link
              href="/create-listing"
              className="hidden rounded-full bg-accent px-4 py-2 text-sm font-medium text-black transition hover:bg-accent/90 sm:inline-flex"
            >
              + New listing
            </Link>
            <LogoutButton />
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 lg:px-8 lg:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted">Seller dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">My listings</h1>
            <p className="mt-2 text-sm text-muted">
              {listings.length === 0
                ? "You have not listed any items yet."
                : `${listings.length} listing${listings.length === 1 ? "" : "s"} in your shop.`}
            </p>
          </div>
          <Link
            href="/create-listing"
            className="rounded-full bg-accent px-5 py-3 text-sm font-medium text-black transition hover:bg-accent/90"
          >
            + New listing
          </Link>
        </div>

        {error ? (
          <div className="mt-8 rounded-3xl border border-rose-500/30 bg-rose-950/40 px-5 py-4 text-sm text-rose-300">
            Could not load listings: {error.message}
          </div>
        ) : null}

        {!error && listings.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-border bg-surface p-10 text-center text-sm text-muted">
            Start selling by{" "}
            <Link href="/create-listing" className="font-medium text-ink underline">
              creating your first listing
            </Link>
            .
          </div>
        ) : null}

        {!error && sellerOrders.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-xl font-semibold tracking-tight text-accent">Sold orders</h2>
            <p className="mt-1 text-sm text-muted">
              {sellerOrders.length} order{sellerOrders.length === 1 ? "" : "s"} — update status and
              view buyer delivery details.
            </p>
            <ul className="mt-4 space-y-4">
              {sellerOrders.map((sellerOrder) => (
                <li key={sellerOrder.order.id}>
                  <SellerOrderCard
                    sellerOrder={sellerOrder}
                    shippingAddress={
                      shippingByListingId.get(sellerOrder.order.listing_id) ?? null
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!error && listings.length > 0 ? (
          <>
            <div className={`space-y-4 lg:hidden ${soldListings.length > 0 ? "mt-10" : "mt-8"}`}>
              {listings.map((listing) => {
                const saleStatus = getSellerListingSaleStatus(listing);
                const winnerLabel =
                  saleStatus === "sold" ? getWinnerLabel(listing, winnerProfileById) : null;
                const buyerAddress =
                  saleStatus === "sold"
                    ? (shippingByListingId.get(listing.id) ?? null)
                    : null;
                const listingOrder =
                  saleStatus === "sold" ? (ordersByListingId.get(listing.id) ?? null) : null;
                const coverUrl = getCoverImageUrl(listing.image_url, listing.listing_images);
                const imageUrls = getGalleryImageUrls(listing.image_url, listing.listing_images);

                return (
                  <article
                    key={listing.id}
                    className="overflow-hidden rounded-3xl border border-border bg-surface"
                  >
                    <div className="flex gap-4 p-4">
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-page-dark">
                        <ListingCover
                          src={coverUrl}
                          alt={listing.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs uppercase tracking-wide text-muted">
                          {listing.category}
                        </p>
                        <h2 className="mt-0.5 line-clamp-2 text-base font-semibold text-ink">
                          {listing.title}
                        </h2>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                          {priceLabel(saleStatus)}
                        </p>
                        <p
                          className={`mt-0.5 text-lg font-semibold tabular-nums ${
                            saleStatus === "sold" ? "text-accent" : "text-ink"
                          }`}
                        >
                          {formatListingPrice(getDisplayPrice(listing))}
                        </p>
                        {winnerLabel ? (
                          <p className="mt-1 text-xs text-muted">
                            Buyer: <span className="font-medium text-ink">{winnerLabel}</span>
                          </p>
                        ) : null}
                        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
                          <div>
                            <dt className="font-medium text-muted">Bids</dt>
                            <dd>{getBidCount(listing)}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-muted">
                              {saleStatus === "live" ? "Ends" : "Ended"}
                            </dt>
                            <dd>{formatDate(listing.auction_end)}</dd>
                          </div>
                        </dl>
                        <div className="mt-3">
                          <SellerListingSaleBadge status={saleStatus} size="sm" />
                        </div>
                      </div>
                    </div>
                    {saleStatus === "sold" ? (
                      <div className="space-y-0 border-t border-border px-4 pb-4">
                        {listingOrder ? (
                          <SellerOrderStatusSelect
                            orderId={listingOrder.id}
                            currentStatus={listingOrder.status}
                            compact
                          />
                        ) : null}
                        <SellerBuyerShippingPanel
                          address={buyerAddress}
                          buyerLabel={winnerLabel}
                          compact
                        />
                      </div>
                    ) : null}
                    <div className="border-t border-border px-4 py-3">
                      <MyListingActions
                        listingId={listing.id}
                        listingTitle={listing.title}
                        imageUrls={imageUrls}
                      />
                    </div>
                  </article>
                );
              })}
            </div>

            <div
              className={`hidden overflow-hidden rounded-3xl border border-border bg-surface lg:block ${
                soldListings.length > 0 ? "mt-10" : "mt-8"
              }`}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-border bg-page-dark text-xs font-medium uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-5 py-4">Listing</th>
                      <th className="px-5 py-4">Price</th>
                      <th className="px-5 py-4">Bids</th>
                      <th className="px-5 py-4">Buyer</th>
                      <th className="px-5 py-4">Delivery</th>
                      <th className="px-5 py-4">Auction end</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {listings.map((listing) => {
                      const saleStatus = getSellerListingSaleStatus(listing);
                      const winnerLabel =
                        saleStatus === "sold"
                          ? getWinnerLabel(listing, winnerProfileById)
                          : null;
                      const buyerAddress =
                        saleStatus === "sold"
                          ? (shippingByListingId.get(listing.id) ?? null)
                          : null;
                      const listingOrder =
                        saleStatus === "sold"
                          ? (ordersByListingId.get(listing.id) ?? null)
                          : null;
                      const coverUrl = getCoverImageUrl(
                        listing.image_url,
                        listing.listing_images
                      );
                      const imageUrls = getGalleryImageUrls(
                        listing.image_url,
                        listing.listing_images
                      );

                      return (
                        <tr
                          key={listing.id}
                          className={`align-middle ${
                            saleStatus === "sold" ? "bg-accent/5" : ""
                          }`}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-4">
                              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-page-dark">
                                <ListingCover
                                  src={coverUrl}
                                  alt={listing.title}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs uppercase tracking-wide text-muted">
                                  {listing.category}
                                </p>
                                <p className="line-clamp-1 font-medium text-ink">
                                  {listing.title}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td
                            className={`px-5 py-4 font-semibold tabular-nums ${
                              saleStatus === "sold" ? "text-accent" : "text-ink"
                            }`}
                          >
                            <span className="block text-[10px] font-medium uppercase tracking-wide text-muted">
                              {priceLabel(saleStatus)}
                            </span>
                            {formatListingPrice(getDisplayPrice(listing))}
                          </td>
                          <td className="px-5 py-4 text-ink/90">{getBidCount(listing)}</td>
                          <td className="px-5 py-4 text-ink/90">
                            {winnerLabel ?? "—"}
                          </td>
                          <td className="px-5 py-4 text-ink/90">
                            {saleStatus === "sold" ? (
                              buyerAddress ? (
                                <span className="text-xs font-medium text-accent">
                                  Address on file
                                </span>
                              ) : (
                                <span className="text-xs text-muted">Awaiting address</span>
                              )
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-5 py-4 text-ink/90">
                            {formatDate(listing.auction_end)}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-2">
                              <SellerListingSaleBadge status={saleStatus} />
                              {listingOrder ? (
                                <OrderStatusBadge status={listingOrder.status} size="sm" />
                              ) : null}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <MyListingActions
                              listingId={listing.id}
                              listingTitle={listing.title}
                              imageUrls={imageUrls}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
