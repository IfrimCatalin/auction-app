import type { SupabaseClient } from "@supabase/supabase-js";

/** True when bidding should be closed (status or auction end time). */
export function isListingAuctionClosed(
  status: string,
  auctionEndIso?: string,
  now: number = Date.now()
): boolean {
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
