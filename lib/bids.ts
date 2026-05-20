import type { SupabaseClient } from "@supabase/supabase-js";

export type BidHistoryEntry = {
  id: string;
  amount: number;
  created_at: string;
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
    bidderLabel: getBidderDisplayLabel(profileById.get(bid.bidder_id)),
  }));
}
