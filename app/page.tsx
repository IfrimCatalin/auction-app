import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/public-navbar";
import { SiteFooter } from "@/components/site-footer";
import { AuctionListingCard } from "@/components/auction-listing-card";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import { getFavoritedListingIds, isListingFavorited } from "@/lib/favorites";
import { LISTING_IMAGES_SELECT, type ListingImageRow } from "@/lib/listing-images";
import { expirePastDueListings } from "@/lib/expire-listings";
import { getListingReserveStatus, type ListingReserveStatus } from "@/lib/reserve-price";
import { container, pageShell } from "@/lib/ui-tokens";
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
    <div className={`${pageShell} flex min-h-screen flex-col`}>
      <PublicNavbar isAuthenticated={isAuthenticated} />

      {/* Hero — gold glow is obvious vs flat black */}
      <section className={`${container} gobid-hero-glow pb-12 pt-10 sm:pb-16 sm:pt-14 lg:pt-20`}>
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
            Premium auctions
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl md:text-6xl lg:text-7xl">
            Rare finds.
            <br />
            <span className="bg-gradient-to-r from-accent-bright via-accent to-accent-dim bg-clip-text text-transparent">
              Honest bids.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            GoBidMe is the calm, image-first marketplace for trusted sellers and serious buyers.
            Discover beautiful objects and place a bid in seconds.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink href={isAuthenticated ? "/auctions" : "/signup"} size="lg">
              Start bidding
            </ButtonLink>
            <ButtonLink href="/auctions" variant="secondary" size="lg">
              Browse auctions
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className={`${container} pb-16`}>
        <SectionTitle
          title="Featured listings"
          description="Fresh items from sellers this week."
          action={
            <ButtonLink href="/auctions" variant="secondary" size="sm">
              See all →
            </ButtonLink>
          }
        />

        {featured.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-base font-semibold text-ink">No live listings yet</p>
            <p className="mt-2 text-sm text-muted">
              Be the first to list an item on GoBidMe.
            </p>
            <ButtonLink href="/create-listing" className="mt-6">
              Create a listing
            </ButtonLink>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

      <section className={`${container} pb-20`}>
        <SectionTitle
          title="Browse by category"
          description="Curated by the GoBidMe community."
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href="/auctions"
              className="group flex flex-col items-start gap-3 rounded-2xl border-2 border-border bg-surface p-5 ring-1 ring-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/15 sm:rounded-3xl sm:p-6"
            >
              <span className="text-3xl transition-transform group-hover:scale-110" aria-hidden>
                {category.emoji}
              </span>
              <span className="text-sm font-semibold text-ink group-hover:text-accent">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
