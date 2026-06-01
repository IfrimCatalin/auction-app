"use client";

import { useMemo } from "react";
import { AuctionListingCard, type AuctionListingCardData } from "@/components/auction-listing-card";
import { useListingsLiveUpdates } from "@/hooks/use-listings-live-updates";
import { getListingReserveStatus } from "@/lib/reserve-price";

type AuctionsLiveGridProps = {
  listings: AuctionListingCardData[];
  favoritedIds: string[];
  isAuthenticated: boolean;
  userId?: string;
};

export function AuctionsLiveGrid({
  listings,
  favoritedIds,
  isAuthenticated,
  userId,
}: AuctionsLiveGridProps) {
  const listingIds = useMemo(() => listings.map((listing) => listing.id), [listings]);

  const initialSnapshots = useMemo(
    () =>
      Object.fromEntries(
        listings.map((listing) => [
          listing.id,
          { current_price: listing.current_price, status: listing.status ?? "active" },
        ])
      ),
    [listings]
  );

  const liveSnapshots = useListingsLiveUpdates({
    listingIds,
    initialSnapshots,
  });

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {listings.map((listing) => {
        const live = liveSnapshots[listing.id];
        const currentPrice = live?.current_price ?? listing.current_price;
        const status = live?.status ?? listing.status ?? "active";
        const reserveStatus = getListingReserveStatus(
          listing.reserve_price ?? null,
          currentPrice
        );

        return (
          <AuctionListingCard
            key={listing.id}
            listing={{
              ...listing,
              current_price: currentPrice,
              status,
              reserveStatus,
            }}
            favorited={favoritedIds.includes(listing.id)}
            isAuthenticated={isAuthenticated}
            userId={userId}
          />
        );
      })}
    </div>
  );
}
