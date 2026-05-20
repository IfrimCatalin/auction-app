/** Display price for listing cards (uses highest bid when above stored current_price). */

export function formatListingPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function getListingDisplayPrice(
  currentPrice: number,
  bids?: { amount: number }[] | null
) {
  const bidAmounts = (bids ?? [])
    .map((bid) => Number(bid.amount))
    .filter((amount) => Number.isFinite(amount));

  if (bidAmounts.length === 0) {
    return currentPrice;
  }

  return Math.max(currentPrice, ...bidAmounts);
}
