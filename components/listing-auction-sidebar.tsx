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
import { LivePrice } from "@/components/live-price";
import { ListingReserveBadge } from "@/components/listing-reserve-badge";
import { useListingLiveBids } from "@/hooks/use-listing-live-bids";
import type { Profile } from "@/lib/profiles";
import { AuctionOutcomePanel } from "@/components/auction-outcome-panel";
import { ListingReviewSection } from "@/components/listing-review-section";
import { getAuctionOutcome } from "@/lib/auction-outcome";
import { SellerBuyerShippingPanel } from "@/components/seller-buyer-shipping-panel";
import { canUserLeaveReview, getWinningBidForReview, type Review } from "@/lib/reviews";
import type { ShippingAddress } from "@/lib/shipping-addresses";
import { BuyerOrderStatusTracker } from "@/components/buyer-order-status-tracker";
import { SellerOrderStatusSelect } from "@/components/seller-order-status-select";
import type { Order } from "@/lib/orders";

type ListingAuctionSidebarProps = {
  listingId: string;
  listingTitle: string;
  currentPrice: number;
  auctionEnd: string;
  listingStatus: string;
  listingIsHidden?: boolean;
  sellerId: string;
  sellerName: string;
  sellerProfile: Profile | null;
  isSeller: boolean;
  user: { id: string } | null;
  isFavorited: boolean;
  bidHistory: BidHistoryEntry[];
  imageUrls: string[];
  reservePrice: number | null;
  existingReview: Review | null;
  winnerProfile: Profile | null;
  buyerShippingAddress: ShippingAddress | null;
  listingOrder: Order | null;
};

export function ListingAuctionSidebar({
  listingId,
  listingTitle,
  currentPrice,
  auctionEnd,
  listingStatus,
  listingIsHidden = false,
  sellerId,
  sellerName,
  sellerProfile,
  isSeller,
  user,
  isFavorited,
  bidHistory,
  imageUrls,
  reservePrice,
  existingReview,
  winnerProfile,
  buyerShippingAddress,
  listingOrder,
}: ListingAuctionSidebarProps) {
  const {
    currentPrice: liveCurrentPrice,
    bids: liveBids,
    listingStatus: liveListingStatus,
    reserveStatus,
    highlightBidId,
  } = useListingLiveBids({
    listingId,
    initialCurrentPrice: currentPrice,
    initialBids: bidHistory,
    initialListingStatus: listingStatus,
    reservePrice,
  });

  const { isEnded: countdownEnded } = useAuctionCountdown(auctionEnd);
  const isEnded =
    countdownEnded || isListingAuctionClosed(liveListingStatus, auctionEnd);

  const winningBid = getWinningBidForReview(liveBids, reserveStatus, isEnded);
  const outcome = getAuctionOutcome(liveBids, reserveStatus, isEnded);
  const isWinner = Boolean(user && winningBid && user.id === winningBid.bidder_id);
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
          <LivePrice value={liveCurrentPrice} size="lg" className="mt-1" />
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

      {isEnded ? (
        <AuctionOutcomePanel
          outcome={outcome}
          winningBid={winningBid}
          finalPrice={liveCurrentPrice}
          isSeller={isSeller}
          isWinner={isWinner}
          sellerId={sellerId}
          sellerName={sellerName}
          sellerProfile={sellerProfile}
          winnerProfile={winnerProfile}
        />
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
          currentPrice={liveCurrentPrice}
          sellerId={sellerId}
          auctionEnd={auctionEnd}
          bidderId={user.id}
          listingStatus={liveListingStatus}
          listingIsHidden={listingIsHidden}
        />
      ) : null}

      <BidHistory
        bids={liveBids}
        isEnded={isEnded}
        reserveStatus={reserveStatus}
        highlightBidId={highlightBidId}
      />

      {isEnded && isSeller && outcome === "sold" && listingOrder ? (
        <SellerOrderStatusSelect orderId={listingOrder.id} currentStatus={listingOrder.status} />
      ) : null}

      {isEnded && isWinner && listingOrder ? (
        <BuyerOrderStatusTracker status={listingOrder.status} />
      ) : null}

      {isEnded && isSeller && outcome === "sold" ? (
        <SellerBuyerShippingPanel
          address={buyerShippingAddress}
          buyerLabel={winningBid?.bidderLabel ?? null}
        />
      ) : null}

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
