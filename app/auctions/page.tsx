import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type ListingCard = {
  id: string;
  title: string;
  category: string;
  current_price: number;
  auction_end: string;
  status: string;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AuctionsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, category, current_price, auction_end, status")
    .eq("status", "active")
    .order("auction_end", { ascending: true });

  const listings = (data ?? []) as ListingCard[];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">BidMe</p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Active Auctions</h1>
            <p className="mt-2 text-sm text-slate-300">
              Browse live listings and open each auction to view full details.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/40 hover:bg-white/5"
          >
            Back Home
          </Link>
        </div>

        {error ? (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            Could not load auctions: {error.message}
          </p>
        ) : null}

        {listings.length === 0 && !error ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-slate-300">
            No active auctions yet.
          </div>
        ) : null}

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/auctions/${listing.id}`}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/30"
            >
              <p className="text-xs uppercase tracking-wide text-slate-400">{listing.category}</p>
              <h2 className="mt-3 line-clamp-2 text-lg font-semibold text-white">{listing.title}</h2>
              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-400">Current price</p>
                  <p className="mt-1 text-2xl font-bold text-cyan-300">
                    {formatPrice(listing.current_price)}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-300">
                  {listing.status}
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-300">Ends: {formatDate(listing.auction_end)}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
