export type ListingImageRow = {
  image_url: string;
  sort_order: number;
};

export type ListingImageRowWithId = ListingImageRow & {
  id: string;
};

export function sortListingImages(images: ListingImageRow[]): ListingImageRow[] {
  return [...images].sort((a, b) => a.sort_order - b.sort_order);
}

/** Cover image: first gallery image, else legacy listings.image_url */
export function getCoverImageUrl(
  legacyImageUrl: string | null | undefined,
  images?: ListingImageRow[] | null
): string | null {
  if (images && images.length > 0) {
    return sortListingImages(images)[0]?.image_url ?? null;
  }
  return legacyImageUrl ?? null;
}

export function getGalleryImageUrls(
  legacyImageUrl: string | null | undefined,
  images?: ListingImageRow[] | null
): string[] {
  if (images && images.length > 0) {
    return sortListingImages(images).map((img) => img.image_url);
  }
  if (legacyImageUrl) {
    return [legacyImageUrl];
  }
  return [];
}

export const LISTING_IMAGES_SELECT = "image_url, sort_order";
export const LISTING_IMAGES_SELECT_WITH_ID = "id, image_url, sort_order";
