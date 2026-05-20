"use client";

import Link from "next/link";
import { AuctionCountdown } from "@/components/auction-countdown";
import { BidForm } from "@/components/bid-form";
import { BidHistory } from "@/components/bid-history";
import { FavoriteButton } from "@/components/favorite-button";
import { ProfileAvatar } from "@/components/profile-avatar";
import { SellerListingActions } from "@/components/seller-listing-actions";
import { useAuctionCountdown } from "@/hooks/use-auction-countdown";
import { isListingAuctionClosed } from "@/lib/expire-listings";
import type { BidHistoryEntry } from "@/lib/bids";
import { formatListingPrice } from "@/lib/listing-price";
import { ListingReserveBadge } from "@/components/listing-reserve-badge";
import type { ListingReserveStatus } from "@/lib/reserve-price";
import type { Profile } from "@/lib/profiles";
import { ListingReviewSection } from "@/components/listing-review-section";
import { canUserLeaveReview, getWinningBidForReview, type Review } from "@/lib/reviews";

type ListingAuctionSidebarProps = {
  listingId: string;
  listingTitle: string;
  currentPrice: number;
  auctionEnd: string;
  listingStatus: string;
  sellerId: string;
  sellerName: string;
  sellerProfile: Profile | null;
  isSeller: boolean;
  user: { id: string } | null;
  isFavorited: boolean;
  bidHistory: BidHistoryEntry[];
  imageUrls: string[];
  reserveStatus: ListingReserveStatus;
  existingReview: Review | null;
};

export function ListingAuctionSidebar({
  listingId,
  listingTitle,
  currentPrice,
  auctionEnd,
  listingStatus,
  sellerId,
  sellerName,
  sellerProfile,
  isSeller,
  user,
  isFavorited,
  bidHistory,
  imageUrls,
  reserveStatus,
  existingReview,
}: ListingAuctionSidebarProps) {
  const { isEnded: countdownEnded } = useAuctionCountdown(auctionEnd);
  const isEnded =
    countdownEnded || isListingAuctionClosed(listingStatus, auctionEnd);

  const winningBid = getWinningBidForReview(bidHistory, reserveStatus, isEnded);
  const showLeaveReview =
    isEnded &&
    Boolean(user) &&
    canUserLeaveReview({
      isEnded,
      reserveStatus,
      winningBid,
      userId: user?.id,
      sellerId,
      existingReview,
    });
  const showExistingReview = isEnded && Boolean(user) && Boolean(existingReview);
  const showReviewSection = showLeaveReview || showExistingReview;

  return (
    <div className="rounded-3xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Current bid</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums text-ink">
            {formatListingPrice(currentPrice)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <AuctionCountdown auctionEnd={auctionEnd} size="lg" />
            <ListingReserveBadge status={reserveStatus} size="md" />
          </div>
        </div>
        {!isSeller ? (
          <FavoriteButton
            listingId={listingId}
            initialFavorited={isFavorited}
            isAuthenticated={Boolean(user)}
            userId={user?.id}
            isOwner={isSeller}
            variant="detail"
          />
        ) : null}
      </div>

      {isEnded ? (
        <p className="mt-6 rounded-2xl border border-border bg-page px-4 py-3 text-center text-sm font-semibold text-ink">
          Auction ended
        </p>
      ) : null}

      {!isEnded && isSeller ? (
        <SellerListingActions
          listingId={listingId}
          listingTitle={listingTitle}
          imageUrls={imageUrls}
        />
      ) : !isEnded && !user ? (
        <div className="mt-6 rounded-2xl border border-border bg-page p-4 text-sm text-muted">
          You need to be signed in to place a bid.{" "}
          <Link
            href="/login"
            className="font-medium text-ink underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </div>
      ) : !isEnded && user ? (
        <BidForm
          listingId={listingId}
          currentPrice={currentPrice}
          sellerId={sellerId}
          auctionEnd={auctionEnd}
          bidderId={user.id}
          listingStatus={listingStatus}
        />
      ) : null}

      <BidHistory bids={bidHistory} isEnded={isEnded} reserveStatus={reserveStatus} />

      {showReviewSection && user ? (
        <ListingReviewSection
          canLeaveReview={showLeaveReview}
          existingReview={existingReview}
          listingId={listingId}
          sellerId={sellerId}
          reviewerId={user.id}
        />
      ) : null}

      {isEnded && isSeller ? (
        <div className="mt-4">
          <SellerListingActions
            listingId={listingId}
            listingTitle={listingTitle}
            imageUrls={imageUrls}
          />
        </div>
      ) : null}

      <Link
        href={`/seller/${sellerId}`}
        className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-page p-4 transition hover:border-accent/40 hover:bg-page-dark"
      >
        <ProfileAvatar profile={sellerProfile} size="sm" />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Sold by</p>
          <p className="truncate text-sm font-semibold text-ink">{sellerName}</p>
          {sellerProfile?.username ? (
            <p className="truncate text-xs text-muted">@{sellerProfile.username}</p>
          ) : null}
        </div>
      </Link>
    </div>
  );
}
