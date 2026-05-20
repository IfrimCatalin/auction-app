export const LISTING_CATEGORY_OPTIONS = [
  "Watches",
  "Art",
  "Cars",
  "Sneakers",
  "Tech",
  "Memorabilia",
  "Other",
] as const;

export const LISTING_STORAGE_BUCKET = "listing-images";
export const MAX_LISTING_IMAGES = 8;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

import { inputBase } from "@/lib/ui-theme";

export const inputBaseClass = inputBase;

export function listingInputClass(hasError: boolean) {
  return hasError ? `${inputBase} border-rose-400/80 focus:border-rose-400` : inputBase;
}

export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function minDatetimeLocalValue(): string {
  const nextMinute = new Date(Date.now() + 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${nextMinute.getFullYear()}-${pad(nextMinute.getMonth() + 1)}-${pad(nextMinute.getDate())}T${pad(nextMinute.getHours())}:${pad(nextMinute.getMinutes())}`;
}

import {
  getAuctionDurationPreset,
  isDurationSelectable,
  type AuctionDurationId,
} from "@/lib/auction-duration";

import {
  validateReservePrice,
  type ReserveMode,
} from "@/lib/reserve-price";

export type ListingFieldErrors = {
  title?: string;
  description?: string;
  category?: string;
  startingPrice?: string;
  reservePrice?: string;
  auctionDuration?: string;
};

export function validateCreateListingFields(values: {
  title: string;
  description: string;
  category: string;
  startingPrice: string;
  reserveMode: ReserveMode;
  reservePrice: string;
  auctionDuration: string;
}): ListingFieldErrors {
  const errors: ListingFieldErrors = {};

  if (!values.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!values.description.trim()) {
    errors.description = "Description is required.";
  }

  if (!values.category || !(LISTING_CATEGORY_OPTIONS as readonly string[]).includes(values.category)) {
    errors.category = "Please select a category.";
  }

  const priceRaw = values.startingPrice.trim();
  const parsedPrice = Number(priceRaw);
  if (!priceRaw) {
    errors.startingPrice = "Starting price is required.";
  } else if (!Number.isFinite(parsedPrice)) {
    errors.startingPrice = "Enter a valid number.";
  } else if (parsedPrice <= 0) {
    errors.startingPrice = "Starting price must be greater than 0.";
  }

  const reserveError = validateReservePrice(
    values.reserveMode,
    values.reservePrice,
    values.startingPrice
  );
  if (reserveError) {
    errors.reservePrice = reserveError;
  }

  const durationError = validateAuctionDuration(values.auctionDuration);
  if (durationError) {
    errors.auctionDuration = durationError;
  }

  return errors;
}

export function validateEditListingFields(values: {
  title: string;
  description: string;
  category: string;
}): ListingFieldErrors {
  const errors: ListingFieldErrors = {};

  if (!values.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!values.description.trim()) {
    errors.description = "Description is required.";
  }

  if (!values.category || !(LISTING_CATEGORY_OPTIONS as readonly string[]).includes(values.category)) {
    errors.category = "Please select a category.";
  }

  return errors;
}

function validateAuctionDuration(durationId: string): string | undefined {
  if (!durationId.trim()) {
    return "Please select an auction duration.";
  }

  const preset = getAuctionDurationPreset(durationId);
  if (!preset) {
    return "Please select a valid auction duration.";
  }

  if (!isDurationSelectable(preset)) {
    return `${preset.label} requires payment before publishing.`;
  }

  return undefined;
}

export function isAuctionDurationId(value: string): value is AuctionDurationId {
  return getAuctionDurationPreset(value) !== undefined;
}
