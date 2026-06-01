"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BidHistoryEntry } from "@/lib/bids";
import { getListingReserveStatus, type ListingReserveStatus } from "@/lib/reserve-price";
import {
  buildBidHistoryEntry,
  mergeBidIntoHistory,
  type RealtimeBidRow,
  type RealtimeListingRow,
} from "@/lib/realtime-bids";

type UseListingLiveBidsOptions = {
  listingId: string;
  initialCurrentPrice: number;
  initialBids: BidHistoryEntry[];
  initialListingStatus: string;
  reservePrice: number | null;
};

export function useListingLiveBids({
  listingId,
  initialCurrentPrice,
  initialBids,
  initialListingStatus,
  reservePrice,
}: UseListingLiveBidsOptions) {
  const supabase = useMemo(() => createClient(), []);
  const labelCacheRef = useRef(new Map<string, string>());

  const [currentPrice, setCurrentPrice] = useState(initialCurrentPrice);
  const [bids, setBids] = useState(initialBids);
  const [listingStatus, setListingStatus] = useState(initialListingStatus);
  const [highlightBidId, setHighlightBidId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPrice(initialCurrentPrice);
    setBids(initialBids);
    setListingStatus(initialListingStatus);
    labelCacheRef.current = new Map(
      initialBids.map((bid) => [bid.bidder_id, bid.bidderLabel])
    );
  }, [listingId, initialCurrentPrice, initialBids, initialListingStatus]);

  const applyOptimisticBid = useCallback((entry: BidHistoryEntry) => {
    setBids((previous) => mergeBidIntoHistory(previous, entry));
    setCurrentPrice(entry.amount);
    setHighlightBidId(entry.id);

    window.setTimeout(() => {
      setHighlightBidId((current) => (current === entry.id ? null : current));
    }, 2200);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`listing-live:${listingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bids",
          filter: `listing_id=eq.${listingId}`,
        },
        async (payload) => {
          const row = payload.new as RealtimeBidRow;
          const entry = await buildBidHistoryEntry(supabase, row, labelCacheRef.current);

          setBids((previous) => mergeBidIntoHistory(previous, entry));
          setCurrentPrice(Number(row.amount));
          setHighlightBidId(row.id);

          window.setTimeout(() => {
            setHighlightBidId((current) => (current === row.id ? null : current));
          }, 2200);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "listings",
          filter: `id=eq.${listingId}`,
        },
        (payload) => {
          const row = payload.new as RealtimeListingRow;
          setCurrentPrice(Number(row.current_price));
          setListingStatus(row.status);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [listingId, supabase]);

  const reserveStatus: ListingReserveStatus = useMemo(
    () => getListingReserveStatus(reservePrice, currentPrice),
    [reservePrice, currentPrice]
  );

  return {
    currentPrice,
    bids,
    listingStatus,
    reserveStatus,
    highlightBidId,
    applyOptimisticBid,
  };
}
