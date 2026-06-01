import { getWinningBidFromRows, type BidRowCore } from "@/lib/bids";
import { isListingAuctionClosed } from "@/lib/expire-listings";
import { getListingReserveStatus } from "@/lib/reserve-price";

export type SellerListingSaleStatus = "live" | "sold" | "ended_unsold";

type ListingSaleInput = {
  status: string;
  auction_end: string;
  current_price: number;
  reserve_price: number | null;
  bids: BidRowCore[] | null | undefined;
};

export function getSellerListingSaleStatus(listing: ListingSaleInput): SellerListingSaleStatus {
  if (!isListingAuctionClosed(listing.status, listing.auction_end)) {
    return "live";
  }

  if (!listing.bids?.length) {
    return "ended_unsold";
  }

  const reserveStatus = getListingReserveStatus(
    listing.reserve_price,
    listing.current_price
  );

  if (reserveStatus === "reserve_not_met") {
    return "ended_unsold";
  }

  if (!getWinningBidFromRows(listing.bids)) {
    return "ended_unsold";
  }

  return "sold";
}

export function getSellerListingSaleLabel(status: SellerListingSaleStatus) {
  switch (status) {
    case "sold":
      return "Sold";
    case "ended_unsold":
      return "Not sold";
    default:
      return "Live";
  }
}

export function sellerListingSaleStatusClass(status: SellerListingSaleStatus) {
  switch (status) {
    case "sold":
      return "bg-accent/15 text-accent border border-accent/30";
    case "ended_unsold":
      return "bg-page-dark text-muted";
    default:
      return "bg-accent/10 text-accent";
  }
}
