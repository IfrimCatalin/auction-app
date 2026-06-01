import type { SupabaseClient } from "@supabase/supabase-js";
import { getBuyerOrders, type BuyerOrderView } from "@/lib/orders";

/** @deprecated Use BuyerOrderView from lib/orders */
export type WonAuctionOrder = BuyerOrderView;

export async function getWonAuctionsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<BuyerOrderView[]> {
  return getBuyerOrders(supabase, userId);
}
