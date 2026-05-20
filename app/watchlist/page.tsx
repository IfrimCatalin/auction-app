import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuctionListingCard } from "@/components/auction-listing-card";
import { LogoutButton } from "@/components/logout-button";
import { isListingFavorited } from "@/lib/favorites";
import { LISTING_IMAGES_SELECT, type ListingImageRow } from "@/lib/listing-images";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Watchlist",
  description: "Your saved auctions on GoBidMe.",
};

type WatchlistListing = {
  id: string;
  seller_id: string;
  title: string;
  category: string;
  current_price: number;
  auction_end: string;
  status: string;
  image_url: string | null;
  listing_images: ListingImageRow[] | null;
};

export default async function WatchlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: favoriteRows, error: favoritesError } = await supabase
    .from("favorites")
    .select("listing_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const listingIds = (favoriteRows ?? []).map((row) => row.listing_id as string);

  let listings: WatchlistListing[] = [];
  let listingsError: { message: string } | null = null;

  if (listingIds.length > 0) {
    const { data: listingsData, error } = await supabase
      .from("listings")
      .select(
        `id, seller_id, title, category, current_price, auction_end, status, image_url, listing_images (${LISTING_IMAGES_SELECT})`
      )
      .in("id", listingIds);

    if (error) {
      listingsError = error;
    } else {
      const byId = new Map(
        ((listingsData ?? []) as WatchlistListing[]).map((listing) => [listing.id, listing])
      );
      listings = listingIds
        .map((id) => byId.get(id))
        .filter((listing): listing is WatchlistListing => listing !== undefined);
    }
  }

  const error = favoritesError ?? listingsError;
  const favoritedIds = new Set(listings.map((listing) => listing.id));

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-stone-50/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            GoBidMe
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-100 sm:inline-flex"
            >
              Dashboard
            </Link>
            <Link
              href="/auctions"
              className="hidden rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-100 sm:inline-flex"
            >
              Browse
            </Link>
            <Link
              href="/notifications"
              className="hidden rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-100 sm:inline-flex"
            >
              Notifications
            </Link>
            <LogoutButton />
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 lg:px-8 lg:pt-14">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Watchlist</h1>
          <p className="mt-2 text-sm text-stone-500">
            Listings you&apos;ve saved to follow and bid on later.
          </p>
        </div>

        {error ? (
          <div className="mt-8 rounded-3xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            Could not load watchlist: {error.message}
          </div>
        ) : null}

        {listings.length === 0 && !error ? (
          <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-10 text-center text-sm text-stone-500">
            Your watchlist is empty.{" "}
            <Link href="/auctions" className="font-medium text-stone-900 underline">
              Browse live auctions
            </Link>{" "}
            and tap the heart to save items you like.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <AuctionListingCard
                key={listing.id}
                listing={listing}
                favorited={isListingFavorited(favoritedIds, listing.id)}
                isAuthenticated
                userId={user.id}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
