import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListingReserveStatus } from "@/lib/reserve-price";

/**
 * Tiered minimum bid increment by current listing price.
 * Must stay in sync with public.get_bid_increment() in Supabase.
 */
export function getBidIncrementForPrice(currentPrice: number): number {
  if (currentPrice < 100) return 5;
  if (currentPrice < 500) return 10;
  if (currentPrice < 1000) return 25;
  if (currentPrice < 5000) return 50;
  return 100;
}

export function getMinimumBidAmount(currentPrice: number) {
  return currentPrice + getBidIncrementForPrice(currentPrice);
}

export function formatBidAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export type BidHistoryEntry = {
  id: string;
  amount: number;
  created_at: string;
  bidder_id: string;
  bidderLabel: string;
};

type BidRow = {
  id: string;
  amount: number;
  created_at: string;
  bidder_id: string;
};

type BidderProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
};

export function getBidderDisplayLabel(
  profile: Pick<BidderProfile, "username" | "full_name"> | null | undefined
) {
  const username = profile?.username?.trim();
  if (username) return `@${username}`;

  const fullName = profile?.full_name?.trim();
  if (fullName) return fullName;

  return "Bidder";
}

/** Bid history: username only — never email or full name. */
export function getBidHistoryBidderLabel(
  profile: Pick<BidderProfile, "username"> | null | undefined
) {
  const username = profile?.username?.trim();
  if (username) return `@${username}`;
  return "Bidder";
}

export function getWinningBid(bids: BidHistoryEntry[]): BidHistoryEntry | null {
  if (bids.length === 0) return null;
  return bids.reduce((best, bid) => {
    if (bid.amount > best.amount) return bid;
    if (bid.amount === best.amount) {
      return new Date(bid.created_at).getTime() > new Date(best.created_at).getTime()
        ? bid
        : best;
    }
    return best;
  }, bids[0]);
}

/** Highest bid counts as winner only when reserve is met or there is no reserve. */
export function getAuctionWinner(
  bids: BidHistoryEntry[],
  reserveStatus: ListingReserveStatus,
  isEnded: boolean
): BidHistoryEntry | null {
  if (!isEnded) return null;
  if (reserveStatus === "reserve_not_met") return null;
  return getWinningBid(bids);
}

export function formatBidPlacedAt(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatBidTimestamp(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24 && now.getDate() === date.getDate()) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function getListingBidHistory(
  supabase: SupabaseClient,
  listingId: string
): Promise<BidHistoryEntry[]> {
  const { data: bidsData, error } = await supabase
    .from("bids")
    .select("id, amount, created_at, bidder_id")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  if (error || !bidsData?.length) {
    return [];
  }

  const bids = bidsData as BidRow[];
  const bidderIds = [...new Set(bids.map((bid) => bid.bidder_id))];

  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .in("id", bidderIds);

  const profileById = new Map(
    ((profilesData ?? []) as BidderProfile[]).map((profile) => [profile.id, profile])
  );

  return bids.map((bid) => ({
    id: bid.id,
    amount: bid.amount,
    created_at: bid.created_at,
    bidder_id: bid.bidder_id,
    bidderLabel: getBidHistoryBidderLabel(profileById.get(bid.bidder_id)),
  }));
}
