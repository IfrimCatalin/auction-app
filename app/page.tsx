import type { Metadata } from "next";
import { GobidMeLogo } from "@/components/gobidme-logo";
import Link from "next/link";
import { AuctionListingCard } from "@/components/auction-listing-card";
import { getFavoritedListingIds, isListingFavorited } from "@/lib/favorites";
import { LISTING_IMAGES_SELECT, type ListingImageRow } from "@/lib/listing-images";
import { expirePastDueListings } from "@/lib/expire-listings";
import { getListingReserveStatus, type ListingReserveStatus } from "@/lib/reserve-price";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "A marketplace for rare and beautiful things",
  description:
    "GoBidMe brings collectors and sellers together—discover live auctions, place bids, and manage listings in one elegant marketplace.",
};

type FeaturedListing = {
  id: string;
  seller_id: string;
  title: string;
  category: string;
  current_price: number;
  created_at: string;
  auction_end: string;
  reserve_price: number | null;
  image_url: string | null;
  listing_images: ListingImageRow[] | null;
  reserveStatus: ListingReserveStatus;
};

const categories = [
  { name: "Watches", emoji: "⌚" },
  { name: "Art", emoji: "🖼️" },
  { name: "Cars", emoji: "🚗" },
  { name: "Sneakers", emoji: "👟" },
  { name: "Tech", emoji: "📱" },
  { name: "Memorabilia", emoji: "🏆" },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);

  await expirePastDueListings(supabase);

  const { data: listingsData } = await supabase
    .from("listings")
    .select(
      `id, seller_id, title, category, current_price, created_at, auction_end, reserve_price, image_url, listing_images (${LISTING_IMAGES_SELECT})`
    )
    .eq("status", "active")
    .eq("is_hidden", false)
    .gt("auction_end", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(6);

  const featured = ((listingsData ?? []) as FeaturedListing[]).map((listing) => ({
    ...listing,
    reserveStatus: getListingReserveStatus(listing.reserve_price, listing.current_price),
  }));
  const favoritedIds = user ? await getFavoritedListingIds(supabase, user.id) : new Set<string>();

  return (
    <main className="min-h-screen bg-page text-ink">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-page/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <GobidMeLogo priority />
          <ul className="hidden items-center gap-7 text-sm text-muted md:flex">
            <li>
              <Link href="/auctions" className="transition hover:text-ink">
                Auctions
              </Link>
            </li>
            <li>
              <Link href="/auctions" className="transition hover:text-ink">
                Categories
              </Link>
            </li>
            <li>
              <Link href="/create-listing" className="transition hover:text-ink">
                Sell
              </Link>
            </li>
          </ul>
          <Link
            href={isAuthenticated ? "/dashboard" : "/login"}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-black transition hover:bg-accent/90"
          >
            {isAuthenticated ? "Dashboard" : "Sign in"}
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 md:pt-20 lg:px-8 lg:pt-24">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-muted">A community for collectors</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl md:text-6xl lg:text-7xl">
            Rare finds.
            <br />
            <span className="text-accent">Honest bids.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted sm:text-lg">
            GoBidMe is the calm, image-first marketplace for trusted sellers and serious buyers.
            Discover beautiful objects and place a bid in seconds.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={isAuthenticated ? "/auctions" : "/signup"}
              className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-black transition hover:bg-accent/90"
            >
              Start bidding
            </Link>
            <Link
              href="/auctions"
              className="rounded-full border border-border bg-surface px-6 py-3 text-sm font-medium text-ink transition hover:bg-page-dark"
            >
              Browse auctions
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Featured listings</h2>
            <p className="mt-1 text-sm text-muted">Fresh items from sellers this week.</p>
          </div>
          <Link
            href="/auctions"
            className="hidden text-sm font-medium text-ink underline-offset-4 hover:underline sm:inline"
          >
            See all
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="rounded-3xl border border-border bg-surface p-10 text-center text-sm text-muted">
            No live listings yet. Be the first to{" "}
            <Link href="/create-listing" className="font-medium text-ink underline">
              create one
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <AuctionListingCard
                key={item.id}
                listing={item}
                favorited={isListingFavorited(favoritedIds, item.id)}
                isAuthenticated={isAuthenticated}
                userId={user?.id}
                showTimeLeft={false}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Browse by category</h2>
        <p className="mt-1 text-sm text-muted">Curated by the GoBidMe community.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href="/auctions"
              className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-surface p-4 transition hover:border-accent/40 hover:shadow-sm"
            >
              <span className="text-2xl" aria-hidden>
                {category.emoji}
              </span>
              <span className="text-sm font-medium text-ink">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-8 text-sm text-muted sm:flex-row sm:items-center lg:px-8">
          <GobidMeLogo className="md:h-16" />
          <p>© {new Date().getFullYear()} GoBidMe</p>
          <div className="flex items-center gap-5">
            <a href="#" className="transition hover:text-ink">
              Terms
            </a>
            <a href="#" className="transition hover:text-ink">
              Privacy
            </a>
            <a href="#" className="transition hover:text-ink">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
