type ListingModerationBannerProps = {
  status: string;
  isHidden: boolean;
};

export function ListingModerationBanner({ status, isHidden }: ListingModerationBannerProps) {
  if (!isHidden && status !== "cancelled") {
    return null;
  }

  const message =
    status === "cancelled"
      ? "This auction was cancelled and is no longer available."
      : "This listing is hidden from public auctions.";

  return (
    <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      {message}
    </div>
  );
}
