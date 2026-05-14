import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type ListingCard = {
  id: string;
  title: string;
  category: string;
  current_price: number;
  auction_end: string;
  status: string;
  image_url: string | null;
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

export default async function AuctionsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, category, current_price, auction_end, status, image_url")
    .eq("status", "active")
    .order("auction_end", { ascending: true });

  const listings = (data ?? []) as ListingCard[];

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-stone-50/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            GoBidMe
          </Link>
          <Link
            href="/create-listing"
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            Sell an item
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 lg:px-8 lg:pt-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Live auctions</h1>
            <p className="mt-2 text-sm text-stone-500">
              Browse listings from sellers around the community.
            </p>
          </div>
          <Link
            href="/"
            className="hidden text-sm font-medium text-stone-600 transition hover:text-stone-900 sm:inline"
          >
            ← Home
          </Link>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            Could not load auctions: {error.message}
          </div>
        ) : null}

        {listings.length === 0 && !error ? (
          <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center text-sm text-stone-500">
            No live auctions yet. Be the first to{" "}
            <Link href="/create-listing" className="font-medium text-stone-900 underline">
              create a listing
            </Link>
            .
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/auctions/${listing.id}`}
              className="group overflow-hidden rounded-3xl border border-stone-200 bg-white transition hover:shadow-md"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
                {listing.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.image_url}
                    alt={listing.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
                    No image
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-stone-700 backdrop-blur">
                  {listing.category}
                </span>
              </div>
              <div className="p-4">
                <h2 className="line-clamp-1 text-base font-medium text-stone-900">
                  {listing.title}
                </h2>
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
          ))}
        </div>
      </section>
    </main>
  );
}
