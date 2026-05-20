import Link from "next/link";
import { GobidMeLogo } from "@/components/gobidme-logo";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { formatListingPrice, getListingDisplayPrice } from "@/lib/listing-price";
import { ListingCover } from "@/components/listing-cover";
import { LogoutButton } from "@/components/logout-button";
import {
  getCoverImageUrl,
  LISTING_IMAGES_SELECT,
  type ListingImageRow,
} from "@/lib/listing-images";
import { getWatchlistCount } from "@/lib/favorites";
import { getUnreadNotificationCount } from "@/lib/notifications";
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

  if (!user) {
    redirect("/login");
  }

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

  return (
    <main className="min-h-screen bg-page text-ink">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-page/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <GobidMeLogo />
          <div className="flex items-center gap-2">
            <Link
              href="/my-listings"
              className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-page-dark sm:inline-flex"
            >
              My Listings
            </Link>
            <Link
              href="/watchlist"
              className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-page-dark sm:inline-flex"
            >
              Watchlist
            </Link>
            <Link
              href="/notifications"
              className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-page-dark sm:inline-flex"
            >
              Notifications
              {unreadNotificationCount > 0 ? ` (${unreadNotificationCount})` : ""}
            </Link>
            <Link
              href="/profile"
              className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-page-dark sm:inline-flex"
            >
              Profile
            </Link>
            <Link
              href="/auctions"
              className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-page-dark sm:inline-flex"
            >
              Browse
            </Link>
            <LogoutButton />
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 lg:px-8 lg:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted">Welcome back</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              {user.email?.split("@")[0]}
            </h1>
            <p className="mt-2 text-sm text-muted">Signed in as {user.email}</p>
          </div>
          <Link
            href="/create-listing"
            className="rounded-full bg-accent px-5 py-3 text-sm font-medium text-black transition hover:bg-accent/90"
          >
            + New listing
          </Link>
        </div>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <article className="rounded-3xl border border-border bg-surface p-5">
            <p className="text-sm text-muted">Active bids</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">12</p>
          </article>
          <Link
            href="/watchlist"
            className="rounded-3xl border border-border bg-surface p-5 transition hover:border-accent/40 hover:shadow-sm"
          >
            <p className="text-sm text-muted">Watchlist</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{watchlistCount}</p>
          </Link>
          <Link
            href="/notifications"
            className="rounded-3xl border border-border bg-surface p-5 transition hover:border-accent/40 hover:shadow-sm"
          >
            <p className="text-sm text-muted">Unread alerts</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{unreadNotificationCount}</p>
          </Link>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Your listings</h2>
              <p className="mt-1 text-sm text-muted">Items you’ve listed for auction.</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/my-listings"
                className="text-sm font-medium text-ink underline-offset-4 hover:underline"
              >
                View all
              </Link>
              <Link
                href="/create-listing"
                className="text-sm font-medium text-ink underline-offset-4 hover:underline"
              >
                Create listing
              </Link>
            </div>
          </div>

          {myListings.length === 0 ? (
            <div className="rounded-3xl border border-border bg-surface p-10 text-center text-sm text-muted">
              You haven’t listed anything yet. Start with{" "}
              <Link href="/create-listing" className="font-medium text-ink underline">
                your first listing
              </Link>
              .
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myListings.map((listing) => {
                const coverUrl = getCoverImageUrl(listing.image_url, listing.listing_images);
                const displayPrice = getListingDisplayPrice(
                  listing.current_price,
                  listing.bids
                );

                return (
                <Link
                  key={listing.id}
                  href={`/auctions/${listing.id}`}
                  className="group overflow-hidden rounded-3xl border border-border bg-surface transition hover:shadow-md"
                >
                  <div className="aspect-square w-full overflow-hidden bg-page-dark">
                    <ListingCover
                      src={coverUrl}
                      alt={listing.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-wide text-muted">
                      {listing.category}
                    </p>
                    <h3 className="mt-1 line-clamp-1 text-base font-medium text-ink">
                      {listing.title}
                    </h3>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                          Current bid
                        </p>
                        <p className="text-lg font-semibold tabular-nums text-ink">
                          {formatListingPrice(displayPrice)}
                        </p>
                      </div>
                      <span className="rounded-full bg-page-dark px-3 py-1 text-[11px] font-medium text-ink/90">
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
      </section>
    </main>
  );
}
