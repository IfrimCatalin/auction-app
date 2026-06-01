"use client";

import Link from "next/link";
import { FavoriteButton } from "@/components/favorite-button";
import { AuctionCountdown } from "@/components/auction-countdown";
import { ListingCover } from "@/components/listing-cover";
import { getCoverImageUrl, type ListingImageRow } from "@/lib/listing-images";
import { LivePrice } from "@/components/live-price";
import { isListingAuctionClosed } from "@/lib/expire-listings";
import {
  ListingVisibilityBadge,
  resolveListingVisibility,
} from "@/components/listing-visibility-badge";
import { useAuctionCountdown } from "@/hooks/use-auction-countdown";
import type { ListingVisibility } from "@/lib/listing-visibility";
import { ListingReserveBadge } from "@/components/listing-reserve-badge";
import type { ListingReserveStatus } from "@/lib/reserve-price";

export type AuctionListingCardData = {
  id: string;
  seller_id: string;
  title: string;
  category: string;
  current_price: number;
  created_at?: string;
  auction_end?: string;
  status?: string;
  reserve_price?: number | null;
  visibility?: ListingVisibility;
  reserveStatus?: ListingReserveStatus;
  image_url: string | null;
  listing_images: ListingImageRow[] | null;
};

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
  const visibility = resolveListingVisibility(listing);
  const auctionEnd = listing.auction_end ?? "";
  const listingStatus = listing.status ?? "active";
  const { isEndingSoon, isEnded: countdownEnded } = useAuctionCountdown(auctionEnd);
  const isClosed =
    countdownEnded || isListingAuctionClosed(listingStatus, auctionEnd) || listingStatus === "ended";

  return (
    <Link
      href={`/auctions/${listing.id}`}
      className={`group overflow-hidden rounded-3xl border bg-surface transition hover:shadow-md ${
        isClosed
          ? "border-border opacity-90"
          : isEndingSoon
            ? "border-accent/50 ring-2 ring-accent/30"
            : "border-border"
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-page-dark">
        <ListingCover
          src={coverUrl}
          alt={listing.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 flex max-w-[calc(100%-3.5rem)] flex-wrap gap-1.5">
          <span className="rounded-full bg-surface/90 px-3 py-1 text-[11px] font-medium text-ink/90 backdrop-blur">
            {listing.category}
          </span>
          <ListingVisibilityBadge visibility={visibility} size="sm" />
          <ListingReserveBadge
            status={listing.reserveStatus ?? "no_reserve"}
            size="sm"
          />
        </div>
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
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Current bid
            </p>
            <LivePrice value={listing.current_price} size="sm" />
          </div>
          {showTimeLeft && auctionEnd ? (
            isClosed ? (
              <span className="rounded-full border border-border bg-page px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                Ended
              </span>
            ) : (
              <AuctionCountdown auctionEnd={auctionEnd} size="sm" />
            )
          ) : null}
        </div>
      </div>
    </Link>
  );
}
