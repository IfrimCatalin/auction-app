import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BidForm } from "@/components/bid-form";
import { ListingImageGallery } from "@/components/listing-image-gallery";
import { SellerListingActions } from "@/components/seller-listing-actions";
import {
  getGalleryImageUrls,
  LISTING_IMAGES_SELECT,
  type ListingImageRow,
} from "@/lib/listing-images";
import { ProfileAvatar } from "@/components/profile-avatar";
import { getProfileById } from "@/lib/profile-server";
import { getProfileDisplayName } from "@/lib/profiles";
import { FavoriteButton } from "@/components/favorite-button";
import { getFavoritedListingIds, isListingFavorited } from "@/lib/favorites";
import { createClient } from "@/lib/supabase/server";

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
  seller_id: string;
  created_at: string;
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
  const { data, error } = await supabase
    .from("listings")
    .select(
      `id, title, description, category, starting_price, current_price, auction_end, status, seller_id, created_at, image_url, listing_images (${LISTING_IMAGES_SELECT})`
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

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-stone-50/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            GoBidMe
          </Link>
          <Link
            href="/auctions"
            className="text-sm font-medium text-stone-600 transition hover:text-stone-900"
          >
            ← All auctions
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4">
            <ListingImageGallery images={galleryUrls} title={listing.title} />

            <div className="rounded-3xl border border-stone-200 bg-white p-6">
              <p className="text-xs uppercase tracking-wide text-stone-500">{listing.category}</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {listing.title}
              </h1>
              <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700">
                {listing.description}
              </p>

              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Starting price
                  </dt>
                  <dd className="mt-1 text-base font-semibold text-stone-900">
                    {formatPrice(listing.starting_price)}
                  </dd>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Auction end
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-stone-900">
                    {formatDate(listing.auction_end)}
                  </dd>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Status
                  </dt>
                  <dd className="mt-1 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    {listing.status}
                  </dd>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Listed
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-stone-900">
                    {formatDate(listing.created_at)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Current bid
                  </p>
                  <p className="mt-1 text-4xl font-semibold tracking-tight text-stone-900">
                    {formatPrice(listing.current_price)}
                  </p>
                </div>
                {!isSeller ? (
                  <FavoriteButton
                    listingId={listing.id}
                    initialFavorited={isFavorited}
                    isAuthenticated={Boolean(user)}
                    userId={user?.id}
                    isOwner={isSeller}
                    variant="detail"
                  />
                ) : null}
              </div>

              {isSeller ? (
                <SellerListingActions
                  listingId={listing.id}
                  listingTitle={listing.title}
                  imageUrls={galleryUrls}
                />
              ) : !user ? (
                <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
                  You need to be signed in to place a bid.{" "}
                  <Link
                    href="/login"
                    className="font-medium text-stone-900 underline-offset-4 hover:underline"
                  >
                    Sign in
                  </Link>
                </div>
              ) : (
                <BidForm
                  listingId={listing.id}
                  currentPrice={listing.current_price}
                  sellerId={listing.seller_id}
                  auctionEnd={listing.auction_end}
                  bidderId={user.id}
                  listingStatus={listing.status}
                />
              )}

              <Link
                href={`/seller/${listing.seller_id}`}
                className="mt-6 flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 transition hover:border-stone-300 hover:bg-stone-100"
              >
                <ProfileAvatar profile={sellerProfile} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Sold by
                  </p>
                  <p className="truncate text-sm font-semibold text-stone-900">{sellerName}</p>
                  {sellerProfile?.username ? (
                    <p className="truncate text-xs text-stone-500">@{sellerProfile.username}</p>
                  ) : null}
                </div>
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
