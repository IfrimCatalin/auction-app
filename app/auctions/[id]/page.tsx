import type { Metadata } from "next";
import { GobidMeLogo } from "@/components/gobidme-logo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingBidHistory } from "@/lib/bids";
import { ListingAuctionSidebar } from "@/components/listing-auction-sidebar";
import { ListingImageGallery } from "@/components/listing-image-gallery";
import {
  getGalleryImageUrls,
  LISTING_IMAGES_SELECT,
  type ListingImageRow,
} from "@/lib/listing-images";
import { getProfileById } from "@/lib/profile-server";
import { getProfileDisplayName } from "@/lib/profiles";
import { getFavoritedListingIds, isListingFavorited } from "@/lib/favorites";
import { expirePastDueListings } from "@/lib/expire-listings";
import { getListingReserveStatus } from "@/lib/reserve-price";
import { getAuctionWinner } from "@/lib/bids";
import { isListingAuctionClosed } from "@/lib/expire-listings";
import { getListingReviewByReviewer } from "@/lib/reviews";
import { getAuctionOutcome } from "@/lib/auction-outcome";
import { getShippingAddressForListing } from "@/lib/shipping-addresses";
import { getOrderForListing } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import { ListingModerationBanner } from "@/components/listing-moderation-banner";
import { ListingVisibilityBadge } from "@/components/listing-visibility-badge";
import { ListingReserveBadge } from "@/components/listing-reserve-badge";
import { inferListingVisibility } from "@/lib/listing-visibility";
import { ListingReportButton } from "@/components/listing-report-button";
import { getUserListingReport } from "@/lib/listing-reports";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("listings").select("title").eq("id", id).maybeSingle();

  if (!data?.title) {
    return { title: "Auction" };
  }

  return {
    title: data.title,
    description: `View details and place bids on ${data.title} at GoBidMe.`,
  };
}

type ListingDetails = {
  id: string;
  title: string;
  description: string;
  category: string;
  starting_price: number;
  current_price: number;
  auction_end: string;
  status: string;
  is_hidden: boolean;
  seller_id: string;
  created_at: string;
  reserve_price: number | null;
  image_url: string | null;
  listing_images: ListingImageRow[] | null;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AuctionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await expirePastDueListings(supabase);

  const { data, error } = await supabase
    .from("listings")
    .select(
      `id, title, description, category, starting_price, current_price, auction_end, status, is_hidden, reserve_price, seller_id, created_at, image_url, listing_images (${LISTING_IMAGES_SELECT})`
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const listing = data as ListingDetails;
  const galleryUrls = getGalleryImageUrls(listing.image_url, listing.listing_images);
  const isSeller = user?.id === listing.seller_id;
  const sellerProfile = await getProfileById(supabase, listing.seller_id);
  const sellerName = getProfileDisplayName(sellerProfile, "Seller");
  const favoritedIds = user ? await getFavoritedListingIds(supabase, user.id) : new Set<string>();
  const isFavorited = isListingFavorited(favoritedIds, listing.id);
  const bidHistory = await getListingBidHistory(supabase, listing.id);
  const visibility = inferListingVisibility(listing.created_at, listing.auction_end);
  const reserveStatus = getListingReserveStatus(
    listing.reserve_price,
    listing.current_price
  );
  const existingReview = user
    ? await getListingReviewByReviewer(supabase, listing.id, user.id)
    : null;
  const isEnded = isListingAuctionClosed(
    listing.status,
    listing.auction_end,
    Date.now(),
    listing.is_hidden
  );
  const winningBid = getAuctionWinner(bidHistory, reserveStatus, isEnded);
  const winnerProfile = winningBid
    ? await getProfileById(supabase, winningBid.bidder_id)
    : null;
  const outcome = getAuctionOutcome(bidHistory, reserveStatus, isEnded);
  const listingOrder = outcome === "sold" ? await getOrderForListing(supabase, listing.id) : null;
  const buyerShippingAddress =
    isSeller && outcome === "sold"
      ? await getShippingAddressForListing(supabase, listing.id)
      : null;
  const userListingReport =
    user && !isSeller
      ? await getUserListingReport(supabase, listing.id, user.id)
      : null;

  return (
    <main className="min-h-screen bg-page text-ink">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-page/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <GobidMeLogo />
          <Link
            href="/auctions"
            className="text-sm font-medium text-muted transition hover:text-ink"
          >
            ← All auctions
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4">
            <ListingImageGallery images={galleryUrls} title={listing.title} />

            <div className="rounded-3xl border border-border bg-surface p-6">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs uppercase tracking-wide text-muted">{listing.category}</p>
                <ListingVisibilityBadge visibility={visibility} size="md" />
                <ListingReserveBadge status={reserveStatus} size="md" />
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {listing.title}
              </h1>
              <div className="mt-4">
                <ListingModerationBanner
                  status={listing.status}
                  isHidden={listing.is_hidden}
                />
              </div>
              {!isSeller ? (
                <div className="mt-4 max-w-sm">
                  <ListingReportButton
                    listingId={listing.id}
                    isAuthenticated={Boolean(user)}
                    isOwner={isSeller}
                    hasExistingReport={Boolean(userListingReport)}
                  />
                </div>
              ) : null}
              <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-ink/90">
                {listing.description}
              </p>

              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-page p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Starting price
                  </dt>
                  <dd className="mt-1 text-base font-semibold text-ink">
                    {formatPrice(listing.starting_price)}
                  </dd>
                </div>
                <div className="rounded-2xl border border-border bg-page p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Auction end
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-ink">
                    {formatDate(listing.auction_end)}
                  </dd>
                </div>
                <div className="rounded-2xl border border-border bg-page p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Status
                  </dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        listing.status === "ended"
                          ? "bg-page-dark text-muted"
                          : listing.status === "active"
                            ? "bg-accent/10 text-accent"
                            : "bg-page-dark text-ink/90"
                      }`}
                    >
                      {listing.status}
                    </span>
                  </dd>
                </div>
                <div className="rounded-2xl border border-border bg-page p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Listed
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-ink">
                    {formatDate(listing.created_at)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <ListingAuctionSidebar
              listingId={listing.id}
              listingTitle={listing.title}
              currentPrice={listing.current_price}
              auctionEnd={listing.auction_end}
              listingStatus={listing.status}
              listingIsHidden={listing.is_hidden}
              sellerId={listing.seller_id}
              sellerName={sellerName}
              sellerProfile={sellerProfile}
              isSeller={isSeller}
              user={user}
              isFavorited={isFavorited}
              bidHistory={bidHistory}
              imageUrls={galleryUrls}
              reservePrice={listing.reserve_price}
              existingReview={existingReview}
              winnerProfile={winnerProfile}
              buyerShippingAddress={buyerShippingAddress}
              listingOrder={listingOrder}
            />
          </aside>
        </div>
      </section>
    </main>
  );
}
