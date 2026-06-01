import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getBidHistoryBidderLabel,
  type BidHistoryEntry,
  type BidRowCore,
} from "@/lib/bids";

export type RealtimeBidRow = BidRowCore & {
  listing_id: string;
};

export type RealtimeListingRow = {
  id: string;
  current_price: number;
  status: string;
};

export function sortBidsNewestFirst(bids: BidHistoryEntry[]): BidHistoryEntry[] {
  return [...bids].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function mergeBidIntoHistory(
  bids: BidHistoryEntry[],
  entry: BidHistoryEntry
): BidHistoryEntry[] {
  if (bids.some((bid) => bid.id === entry.id)) {
    return bids;
  }
  return sortBidsNewestFirst([entry, ...bids]);
}

export async function buildBidHistoryEntry(
  supabase: SupabaseClient,
  row: RealtimeBidRow,
  labelCache: Map<string, string>
): Promise<BidHistoryEntry> {
  let bidderLabel = labelCache.get(row.bidder_id);
  if (!bidderLabel) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("id", row.bidder_id)
      .maybeSingle();

    bidderLabel = getBidHistoryBidderLabel(
      profile as { username: string | null } | null
    );
    labelCache.set(row.bidder_id, bidderLabel);
  }

  return {
    id: row.id,
    amount: Number(row.amount),
    created_at: row.created_at,
    bidder_id: row.bidder_id,
    bidderLabel,
  };
}
