import {
  AUCTION_DURATION_PRESETS,
  getAuctionDurationPreset,
  type AuctionDurationId,
} from "@/lib/auction-duration";

export type ListingVisibility = "normal" | "premium" | "featured";

export const VISIBILITY_SORT_ORDER: Record<ListingVisibility, number> = {
  featured: 0,
  premium: 1,
  normal: 2,
};

const DURATION_HOURS_TO_VISIBILITY = new Map<number, ListingVisibility>(
  AUCTION_DURATION_PRESETS.map((preset) => [
    preset.hours,
    preset.tier === "featured"
      ? "featured"
      : preset.tier === "premium"
        ? "premium"
        : "normal",
  ])
);

/** Maps selected duration at publish time to listing visibility. */
export function getVisibilityFromDurationId(durationId: AuctionDurationId): ListingVisibility {
  const preset = getAuctionDurationPreset(durationId);
  if (!preset) return "normal";
  if (preset.tier === "featured") return "featured";
  if (preset.tier === "premium") return "premium";
  return "normal";
}

/**
 * Infer visibility for existing listings from listing window length.
 * Matches preset durations (24h, 3d, 7d, 14d) with tolerance for clock skew.
 */
export function inferListingVisibility(
  createdAt: string,
  auctionEnd: string
): ListingVisibility {
  const startMs = new Date(createdAt).getTime();
  const endMs = new Date(auctionEnd).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return "normal";
  }

  const hours = (endMs - startMs) / (60 * 60 * 1000);

  for (const preset of AUCTION_DURATION_PRESETS) {
    if (Math.abs(hours - preset.hours) <= 2) {
      return DURATION_HOURS_TO_VISIBILITY.get(preset.hours) ?? "normal";
    }
  }

  if (hours >= 24 * 12) return "featured";
  if (hours >= 24 * 5) return "premium";
  return "normal";
}

export type ListingSortKey = "ending_soon" | "newest" | "price_asc" | "price_desc";

export type ListingWithVisibilityFields = {
  created_at: string;
  auction_end: string;
  current_price: number;
};

export function sortListingsByVisibilityThenUserSort<T extends ListingWithVisibilityFields>(
  listings: T[],
  sortKey: ListingSortKey
): T[] {
  const ranked = listings.map((listing) => ({
    listing,
    visibility: inferListingVisibility(listing.created_at, listing.auction_end),
  }));

  ranked.sort((a, b) => {
    const visibilityDiff =
      VISIBILITY_SORT_ORDER[a.visibility] - VISIBILITY_SORT_ORDER[b.visibility];
    if (visibilityDiff !== 0) return visibilityDiff;

    switch (sortKey) {
      case "newest":
        return (
          new Date(b.listing.created_at).getTime() - new Date(a.listing.created_at).getTime()
        );
      case "price_asc":
        return a.listing.current_price - b.listing.current_price;
      case "price_desc":
        return b.listing.current_price - a.listing.current_price;
      case "ending_soon":
      default:
        return (
          new Date(a.listing.auction_end).getTime() - new Date(b.listing.auction_end).getTime()
        );
    }
  });

  return ranked.map(({ listing }) => listing);
}

/** Reserved for Stripe — paid visibility tiers may require checkout before publish. */
export function isVisibilityTierPaid(visibility: ListingVisibility): boolean {
  return visibility === "premium" || visibility === "featured";
}

export function isVisibilitySelectable(
  visibility: ListingVisibility,
  options?: { paymentsEnabled?: boolean }
): boolean {
  if (!options?.paymentsEnabled) return true;
  return !isVisibilityTierPaid(visibility);
}
