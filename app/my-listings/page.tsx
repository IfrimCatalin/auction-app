import type { Metadata } from "next";
import { GobidMeLogo } from "@/components/gobidme-logo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ListingCover } from "@/components/listing-cover";
import { LogoutButton } from "@/components/logout-button";
import { MyListingActions } from "@/components/my-listing-actions";
import {
  getCoverImageUrl,
  getGalleryImageUrls,
  LISTING_IMAGES_SELECT,
  type ListingImageRow,
} from "@/lib/listing-images";
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
  image_url: string | null;
  listing_images: ListingImageRow[] | null;
  bids: { count: number }[] | null;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getBidCount(listing: SellerListing) {
  return listing.bids?.[0]?.count ?? 0;
}

function statusClass(status: string) {
  if (status === "active") {
    return "bg-accent/10 text-accent";
  }
  return "bg-page-dark text-ink/90";
}

export default async function MyListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("listings")
    .select(
      `id, title, category, current_price, auction_end, status, image_url, listing_images (${LISTING_IMAGES_SELECT}), bids(count)`
    )
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const listings = (data ?? []) as SellerListing[];

  return (
    <main className="min-h-screen bg-page text-ink">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-page/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <GobidMeLogo />
          <div className="flex items-center gap-2">
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

        {!error && listings.length > 0 ? (
          <>
            <div className="mt-8 space-y-4 lg:hidden">
              {listings.map((listing) => {
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
                        <p className="mt-2 text-lg font-semibold text-ink">
                          {formatPrice(listing.current_price)}
                        </p>
                        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
                          <div>
                            <dt className="font-medium text-muted">Bids</dt>
                            <dd>{getBidCount(listing)}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-muted">Ends</dt>
                            <dd>{formatDate(listing.auction_end)}</dd>
                          </div>
                        </dl>
                        <span
                          className={`mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${statusClass(listing.status)}`}
                        >
                          {listing.status}
                        </span>
                      </div>
                    </div>
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

            <div className="mt-8 hidden overflow-hidden rounded-3xl border border-border bg-surface lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-border bg-page-dark text-xs font-medium uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-5 py-4">Listing</th>
                      <th className="px-5 py-4">Current price</th>
                      <th className="px-5 py-4">Bids</th>
                      <th className="px-5 py-4">Auction end</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {listings.map((listing) => {
                      const coverUrl = getCoverImageUrl(
                        listing.image_url,
                        listing.listing_images
                      );
                      const imageUrls = getGalleryImageUrls(
                        listing.image_url,
                        listing.listing_images
                      );

                      return (
                        <tr key={listing.id} className="align-middle">
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
                          <td className="px-5 py-4 font-semibold text-ink">
                            {formatPrice(listing.current_price)}
                          </td>
                          <td className="px-5 py-4 text-ink/90">{getBidCount(listing)}</td>
                          <td className="px-5 py-4 text-ink/90">
                            {formatDate(listing.auction_end)}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClass(listing.status)}`}
                            >
                              {listing.status}
                            </span>
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
