import type { SupabaseClient } from "@supabase/supabase-js";
import type { BidHistoryEntry } from "@/lib/bids";
import { getAuctionWinner } from "@/lib/bids";
import type { ListingReserveStatus } from "@/lib/reserve-price";
import type { OrderStatus } from "@/lib/orders";
import {
  isOrderPaymentComplete,
  type PaymentStatus,
} from "@/lib/order-payments";

export type Review = {
  id: string;
  listing_id: string;
  reviewer_id: string;
  seller_id: string;
  rating: number;
  comment: string;
  created_at: string;
};

export type ReviewWithReviewer = Review & {
  reviewerLabel: string;
};

export type SellerRatingSummary = {
  averageRating: number | null;
  reviewCount: number;
};

type ReviewerProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
};

/** Public review display — username, then full name, never email. */
export function getReviewerDisplayName(
  profile: Pick<ReviewerProfile, "username" | "full_name"> | null | undefined
) {
  const username = profile?.username?.trim();
  if (username) return `@${username}`;

  const fullName = profile?.full_name?.trim();
  if (fullName) return fullName;

  return "Buyer";
}

export function canUserLeaveReview(options: {
  isEnded: boolean;
  reserveStatus: ListingReserveStatus;
  winningBid: BidHistoryEntry | null;
  userId: string | undefined;
  sellerId: string;
  existingReview: Review | null;
  orderPaymentStatus?: PaymentStatus | null;
  orderStatus?: OrderStatus | null;
}): boolean {
  if (!options.isEnded) return false;
  if (!options.userId) return false;
  if (options.userId === options.sellerId) return false;
  if (options.reserveStatus === "reserve_not_met") return false;
  if (!options.winningBid) return false;
  if (options.winningBid.bidder_id !== options.userId) return false;
  if (options.existingReview) return false;
  if (!options.orderPaymentStatus || !isOrderPaymentComplete(options.orderPaymentStatus)) {
    return false;
  }
  if (options.orderStatus !== "delivered") {
    return false;
  }
  return true;
}

export function getWinningBidForReview(
  bids: BidHistoryEntry[],
  reserveStatus: ListingReserveStatus,
  isEnded: boolean
): BidHistoryEntry | null {
  return getAuctionWinner(bids, reserveStatus, isEnded);
}

export async function getListingReviewByReviewer(
  supabase: SupabaseClient,
  listingId: string,
  reviewerId: string
): Promise<Review | null> {
  const { data } = await supabase
    .from("reviews")
    .select("id, listing_id, reviewer_id, seller_id, rating, comment, created_at")
    .eq("listing_id", listingId)
    .eq("reviewer_id", reviewerId)
    .maybeSingle();

  return (data as Review | null) ?? null;
}

export async function getSellerRatingSummary(
  supabase: SupabaseClient,
  sellerId: string
): Promise<SellerRatingSummary> {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("seller_id", sellerId);

  if (error || !data?.length) {
    return { averageRating: null, reviewCount: 0 };
  }

  const ratings = data.map((row) => Number(row.rating)).filter((n) => Number.isFinite(n));
  if (ratings.length === 0) {
    return { averageRating: null, reviewCount: 0 };
  }

  const sum = ratings.reduce((total, rating) => total + rating, 0);
  return {
    averageRating: Math.round((sum / ratings.length) * 10) / 10,
    reviewCount: ratings.length,
  };
}

export async function getSellerReviews(
  supabase: SupabaseClient,
  sellerId: string,
  limit = 8
): Promise<ReviewWithReviewer[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, listing_id, reviewer_id, seller_id, rating, comment, created_at")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) {
    return [];
  }

  const reviews = data as Review[];
  const reviewerIds = [...new Set(reviews.map((review) => review.reviewer_id))];

  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .in("id", reviewerIds);

  const profileById = new Map(
    ((profilesData ?? []) as ReviewerProfile[]).map((profile) => [profile.id, profile])
  );

  return reviews.map((review) => ({
    ...review,
    reviewerLabel: getReviewerDisplayName(profileById.get(review.reviewer_id)),
  }));
}

export function formatReviewDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
