export type ListingReserveStatus = "no_reserve" | "reserve_met" | "reserve_not_met";

export type ReserveMode = "none" | "set";

/** Buyer-safe status — never reveals reserve_price amount. */
export function getListingReserveStatus(
  reservePrice: number | null | undefined,
  currentPrice: number
): ListingReserveStatus {
  if (reservePrice == null || !Number.isFinite(Number(reservePrice))) {
    return "no_reserve";
  }

  if (currentPrice >= Number(reservePrice)) {
    return "reserve_met";
  }

  return "reserve_not_met";
}

export function hasListingReserve(reservePrice: number | null | undefined): boolean {
  return reservePrice != null && Number.isFinite(Number(reservePrice));
}

export function validateReservePrice(
  mode: ReserveMode,
  reservePriceRaw: string,
  startingPriceRaw: string
): string | undefined {
  if (mode === "none") {
    return undefined;
  }

  const reserveRaw = reservePriceRaw.trim();
  if (!reserveRaw) {
    return "Enter a reserve price or choose No reserve.";
  }

  const reserve = Number(reserveRaw);
  const starting = Number(startingPriceRaw.trim());

  if (!Number.isFinite(reserve) || reserve <= 0) {
    return "Reserve price must be greater than 0.";
  }

  if (!Number.isFinite(starting) || starting <= 0) {
    return "Set a valid starting price first.";
  }

  if (reserve <= starting) {
    return "Reserve price must be greater than the starting price.";
  }

  return undefined;
}

export function parseReservePriceForInsert(
  mode: ReserveMode,
  reservePriceRaw: string
): number | null {
  if (mode === "none") return null;
  const parsed = Number(reservePriceRaw.trim());
  return Number.isFinite(parsed) ? parsed : null;
}
