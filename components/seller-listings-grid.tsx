import Link from "next/link";
import { ListingCover } from "@/components/listing-cover";
import {
  getCoverImageUrl,
  type ListingImageRow,
} from "@/lib/listing-images";

export type SellerListingCard = {
  id: string;
  title: string;
  category: string;
  current_price: number;
  auction_end: string;
  image_url: string | null;
  listing_images: ListingImageRow[] | null;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRelative(value: string) {
  const diffMs = new Date(value).getTime() - Date.now();
  if (diffMs <= 0) return "Ended";
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) return `${minutes}m left`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h left`;
  const days = Math.round(hours / 24);
  return `${days}d left`;
}

type SellerListingsGridProps = {
  listings: SellerListingCard[];
  emptyMessage?: string;
};

export function SellerListingsGrid({
  listings,
  emptyMessage = "No active listings right now.",
}: SellerListingsGridProps) {
  if (listings.length === 0) {
    return (
      <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center text-sm text-stone-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => {
        const coverUrl = getCoverImageUrl(listing.image_url, listing.listing_images);

        return (
          <Link
            key={listing.id}
            href={`/auctions/${listing.id}`}
            className="group overflow-hidden rounded-3xl border border-stone-200 bg-white transition hover:shadow-md"
          >
            <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
              <ListingCover
                src={coverUrl}
                alt={listing.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-stone-700 backdrop-blur">
                {listing.category}
              </span>
            </div>
            <div className="p-4">
              <h3 className="line-clamp-1 text-base font-medium text-stone-900">{listing.title}</h3>
              <div className="mt-3 flex items-end justify-between">
                <p className="text-lg font-semibold text-stone-900">
                  {formatPrice(listing.current_price)}
                </p>
                <p className="text-xs font-medium text-stone-500">
                  {formatRelative(listing.auction_end)}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
