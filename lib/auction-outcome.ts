import { getAuctionWinner, type BidHistoryEntry } from "@/lib/bids";
import type { ListingReserveStatus } from "@/lib/reserve-price";

export type AuctionOutcome = "active" | "no_bids" | "reserve_not_met" | "sold";

export function getAuctionOutcome(
  bids: BidHistoryEntry[],
  reserveStatus: ListingReserveStatus,
  isEnded: boolean
): AuctionOutcome {
  if (!isEnded) return "active";
  if (bids.length === 0) return "no_bids";
  if (reserveStatus === "reserve_not_met") return "reserve_not_met";
  if (getAuctionWinner(bids, reserveStatus, isEnded)) return "sold";
  return "no_bids";
}
