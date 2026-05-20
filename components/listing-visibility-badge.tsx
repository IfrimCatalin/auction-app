import { inferListingVisibility, type ListingVisibility } from "@/lib/listing-visibility";

type ListingVisibilityBadgeProps = {
  visibility: ListingVisibility;
  size?: "sm" | "md";
  className?: string;
};

function badgeLabel(visibility: ListingVisibility) {
  if (visibility === "featured") return "Featured";
  if (visibility === "premium") return "Premium";
  return null;
}

function badgeClass(visibility: ListingVisibility, size: "sm" | "md") {
  const sizeClass =
    size === "sm"
      ? "px-2 py-0.5 text-[10px]"
      : "px-2.5 py-1 text-[11px]";

  if (visibility === "featured") {
    return `${sizeClass} bg-accent font-semibold uppercase tracking-wide text-black`;
  }
  if (visibility === "premium") {
    return `${sizeClass} border border-accent/50 bg-accent/15 font-semibold uppercase tracking-wide text-accent`;
  }
  return "";
}

export function ListingVisibilityBadge({
  visibility,
  size = "sm",
  className = "",
}: ListingVisibilityBadgeProps) {
  const label = badgeLabel(visibility);
  if (!label) return null;

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full ${badgeClass(visibility, size)} ${className}`}
    >
      {label}
    </span>
  );
}

export function resolveListingVisibility(listing: {
  visibility?: ListingVisibility;
  created_at?: string;
  auction_end?: string;
}): ListingVisibility {
  if (listing.visibility) return listing.visibility;
  if (listing.created_at && listing.auction_end) {
    return inferListingVisibility(listing.created_at, listing.auction_end);
  }
  return "normal";
}
