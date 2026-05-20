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

export type ListingFieldErrors = {
  title?: string;
  description?: string;
  category?: string;
  startingPrice?: string;
  auctionEnd?: string;
};

export function validateCreateListingFields(values: {
  title: string;
  description: string;
  category: string;
  startingPrice: string;
  auctionEnd: string;
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

  const auctionEndError = validateAuctionEnd(values.auctionEnd);
  if (auctionEndError) {
    errors.auctionEnd = auctionEndError;
  }

  return errors;
}

export function validateEditListingFields(values: {
  title: string;
  description: string;
  category: string;
  auctionEnd: string;
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

  const auctionEndError = validateAuctionEnd(values.auctionEnd);
  if (auctionEndError) {
    errors.auctionEnd = auctionEndError;
  }

  return errors;
}

function validateAuctionEnd(auctionEnd: string): string | undefined {
  const endRaw = auctionEnd.trim();
  if (!endRaw) {
    return "Auction end date is required.";
  }

  const auctionEndDate = new Date(endRaw);
  if (Number.isNaN(auctionEndDate.getTime())) {
    return "Enter a valid date and time.";
  }

  if (auctionEndDate.getTime() <= Date.now()) {
    return "Auction end must be in the future.";
  }

  return undefined;
}
