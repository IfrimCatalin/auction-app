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
import { cardHover } from "@/lib/ui-tokens";
import { cn } from "@/lib/cn";

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
      className={cn(
        "group block overflow-hidden",
        cardHover,
        isClosed && "opacity-85",
        isEndingSoon && !isClosed && "border-accent ring-2 ring-accent/40"
      )}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-page-dark sm:aspect-[5/6]">
        <div className="absolute inset-x-0 top-0 z-[1] h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-80" />
        <ListingCover
          src={coverUrl}
          alt={listing.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-accent/30 bg-black/60 px-3 py-1 text-[11px] font-semibold text-accent backdrop-blur">
              {listing.category}
            </span>
            <ListingVisibilityBadge visibility={visibility} size="sm" />
            <ListingReserveBadge status={listing.reserveStatus ?? "no_reserve"} size="sm" />
          </div>
        </div>
        {!isOwner ? (
          <div className="absolute right-3 top-4 z-10">
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
      <div className="border-t border-border/80 bg-elevated/50 p-5 sm:p-6">
        <h2 className="line-clamp-2 text-lg font-bold leading-snug text-ink group-hover:text-accent">
          {listing.title}
        </h2>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent/80">
              Current bid
            </p>
            <LivePrice value={listing.current_price} size="sm" />
          </div>
          {showTimeLeft && auctionEnd ? (
            isClosed ? (
              <span className="rounded-full border border-border bg-page px-3 py-1.5 text-[10px] font-bold uppercase text-muted">
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
