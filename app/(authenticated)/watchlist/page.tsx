import type { Metadata } from "next";
import { AuthenticatedSection } from "@/components/authenticated-layout";
import { AuctionListingCard } from "@/components/auction-listing-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { isListingFavorited } from "@/lib/favorites";
import { LISTING_IMAGES_SELECT, type ListingImageRow } from "@/lib/listing-images";
import { getListingReserveStatus, type ListingReserveStatus } from "@/lib/reserve-price";
import { expirePastDueListings } from "@/lib/expire-listings";
import { errorBox } from "@/lib/ui-tokens";
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
  created_at: string;
  auction_end: string;
  status: string;
  reserve_price: number | null;
  image_url: string | null;
  listing_images: ListingImageRow[] | null;
  reserveStatus: ListingReserveStatus;
};

export default async function WatchlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  await expirePastDueListings(supabase);

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
        `id, seller_id, title, category, current_price, created_at, auction_end, status, reserve_price, image_url, listing_images (${LISTING_IMAGES_SELECT})`
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
        .filter((listing): listing is WatchlistListing => listing !== undefined)
        .map((listing) => ({
          ...listing,
          reserveStatus: getListingReserveStatus(
            listing.reserve_price,
            listing.current_price
          ),
        }));
    }
  }

  const error = favoritesError ?? listingsError;
  const favoritedIds = new Set(listings.map((listing) => listing.id));

  return (
    <AuthenticatedSection>
      <PageHeader
        eyebrow="Saved"
        title="Watchlist"
        description="Listings you've saved to follow and bid on later."
        actions={
          <ButtonLink href="/auctions" variant="secondary" size="sm">
            Browse auctions
          </ButtonLink>
        }
      />

      {error ? (
        <p className={`${errorBox} mt-8`}>Could not load watchlist: {error.message}</p>
      ) : null}

      {listings.length === 0 && !error ? (
        <EmptyState
          className="mt-10"
          title="Your watchlist is empty"
          description="Browse live auctions and tap the heart to save items you like."
          actionLabel="Browse auctions"
          actionHref="/auctions"
        />
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
    </AuthenticatedSection>
  );
}
