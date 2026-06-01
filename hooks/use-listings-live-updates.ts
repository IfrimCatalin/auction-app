"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeListingRow } from "@/lib/realtime-bids";

export type ListingLiveSnapshot = {
  current_price: number;
  status: string;
};

type UseListingsLiveUpdatesOptions = {
  listingIds: string[];
  initialSnapshots: Record<string, ListingLiveSnapshot>;
};

export function useListingsLiveUpdates({
  listingIds,
  initialSnapshots,
}: UseListingsLiveUpdatesOptions) {
  const supabase = useMemo(() => createClient(), []);
  const [snapshots, setSnapshots] = useState(initialSnapshots);
  const listingIdsKey = listingIds.join(",");

  useEffect(() => {
    setSnapshots(initialSnapshots);
  }, [listingIdsKey, initialSnapshots]);

  useEffect(() => {
    if (listingIds.length === 0) {
      return;
    }

    const idSet = new Set(listingIds);

    const channel = supabase
      .channel("auctions-listings-live")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "listings",
        },
        (payload) => {
          const row = payload.new as RealtimeListingRow;
          if (!idSet.has(row.id)) {
            return;
          }

          setSnapshots((previous) => ({
            ...previous,
            [row.id]: {
              current_price: Number(row.current_price),
              status: row.status,
            },
          }));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [listingIdsKey, listingIds, supabase]);

  return snapshots;
}
