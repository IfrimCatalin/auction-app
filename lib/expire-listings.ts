import type { SupabaseClient } from "@supabase/supabase-js";

/** True when bidding should be closed (status, moderation, or auction end time). */
export function isListingAuctionClosed(
  status: string,
  auctionEndIso?: string,
  now: number = Date.now(),
  isHidden?: boolean | null
): boolean {
  if (isHidden) {
    return true;
  }

  if (status === "ended" || status === "cancelled") {
    return true;
  }

  if (auctionEndIso) {
    const endMs = new Date(auctionEndIso).getTime();
    if (Number.isFinite(endMs) && endMs <= now) {
      return true;
    }
  }

  return false;
}

/**
 * Marks active listings past auction_end as ended.
 * Requires public.expire_past_due_listings() in Supabase (security definer).
 */
export async function expirePastDueListings(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.rpc("expire_past_due_listings");

  if (error) {
    console.error("[expirePastDueListings]", error.message);
  }
}

/** Creates orders for ended auctions with a valid winning bidder. */
export async function syncAuctionOrders(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.rpc("sync_auction_orders");

  if (error) {
    console.error("[syncAuctionOrders]", error.message);
  }
}
