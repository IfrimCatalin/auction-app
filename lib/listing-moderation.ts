/** Listing removed from public browse (admin hide or cancel). */
export function isListingRemovedFromMarketplace(listing: {
  status: string;
  is_hidden?: boolean | null;
}): boolean {
  return listing.status === "cancelled" || listing.is_hidden === true;
}
