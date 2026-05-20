/** Auctions ending within this window show "Ending soon" and card highlight. */
export const ENDING_SOON_MS = 60 * 60 * 1000;

export type AuctionCountdownState = {
  isEnded: boolean;
  isEndingSoon: boolean;
  label: string;
};

export function getAuctionCountdownState(
  auctionEndIso: string,
  now: number = Date.now()
): AuctionCountdownState {
  const endMs = new Date(auctionEndIso).getTime();
  if (!Number.isFinite(endMs)) {
    return { isEnded: true, isEndingSoon: false, label: "Auction ended" };
  }

  const diffMs = endMs - now;

  if (diffMs <= 0) {
    return { isEnded: true, isEndingSoon: false, label: "Auction ended" };
  }

  if (diffMs < ENDING_SOON_MS) {
    return { isEnded: false, isEndingSoon: true, label: "Ending soon" };
  }

  return {
    isEnded: false,
    isEndingSoon: false,
    label: formatCountdownLabel(diffMs),
  };
}

export function formatCountdownLabel(diffMs: number): string {
  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }

  if (minutes > 0) {
    return `${minutes}m left`;
  }

  return "Ending soon";
}
