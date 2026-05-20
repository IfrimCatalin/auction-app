import Link from "next/link";
import { FavoriteButton } from "@/components/favorite-button";
import { ListingCover } from "@/components/listing-cover";
import { getCoverImageUrl, type ListingImageRow } from "@/lib/listing-images";

export type AuctionListingCardData = {
  id: string;
  seller_id: string;
  title: string;
  category: string;
  current_price: number;
  auction_end?: string;
  image_url: string | null;
  listing_images: ListingImageRow[] | null;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRelative(value: string) {
  const diffMs = new Date(value).getTime() - Date.now();
  if (diffMs <= 0) return "Ended";
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) return `${minutes}m left`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h left`;
  const days = Math.round(hours / 24);
  return `${days}d left`;
}

type AuctionListingCardProps = {
  listing: AuctionListingCardData;
  favorited: boolean;
  isAuthenticated: boolean;
  userId?: string;
  showTimeLeft?: boolean;
};

export function AuctionListingCard({
  listing,
  favorited,
  isAuthenticated,
  userId,
  showTimeLeft = true,
}: AuctionListingCardProps) {
  const coverUrl = getCoverImageUrl(listing.image_url, listing.listing_images);
  const isOwner = Boolean(userId && listing.seller_id === userId);

  return (
    <Link
      href={`/auctions/${listing.id}`}
      className="group overflow-hidden rounded-3xl border border-border bg-surface transition hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-page-dark">
        <ListingCover
          src={coverUrl}
          alt={listing.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-3 py-1 text-[11px] font-medium text-ink/90 backdrop-blur">
          {listing.category}
        </span>
        {!isOwner ? (
          <div className="absolute right-3 top-3 z-10">
            <FavoriteButton
              listingId={listing.id}
              initialFavorited={favorited}
              isAuthenticated={isAuthenticated}
              userId={userId}
              isOwner={isOwner}
              variant="card"
            />
          </div>
        ) : null}
      </div>
      <div className="p-4">
        <h2 className="line-clamp-1 text-base font-medium text-ink">{listing.title}</h2>
        <div className="mt-3 flex items-end justify-between gap-2">
          <p className="text-lg font-semibold text-ink">
            {formatPrice(listing.current_price)}
          </p>
          {showTimeLeft && listing.auction_end ? (
            <p className="text-xs font-medium text-muted">
              {formatRelative(listing.auction_end)}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
