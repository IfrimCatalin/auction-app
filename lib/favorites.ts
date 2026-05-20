import type { SupabaseClient } from "@supabase/supabase-js";

export type FavoriteRow = {
  user_id: string;
  listing_id: string;
  created_at: string;
};

export async function getFavoritedListingIds(
  supabase: SupabaseClient,
  userId: string
): Promise<Set<string>> {
  const { data } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("user_id", userId);

  return new Set((data ?? []).map((row) => row.listing_id as string));
}

export async function getWatchlistCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from("favorites")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return count ?? 0;
}

export function isListingFavorited(favoritedIds: Set<string>, listingId: string) {
  return favoritedIds.has(listingId);
}
