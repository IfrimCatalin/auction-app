import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BidForm } from "@/components/bid-form";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("listings").select("title").eq("id", id).maybeSingle();

  if (!data?.title) {
    return { title: "Auction" };
  }

  return {
    title: data.title,
    description: `View details and place bids on ${data.title} at GoBidMe.`,
  };
}

type ListingDetails = {
  id: string;
  title: string;
  description: string;
  category: string;
  starting_price: number;
  current_price: number;
  auction_end: string;
  status: string;
  seller_id: string;
  created_at: string;
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

export default async function AuctionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("listings")
    .select(
      "id, title, description, category, starting_price, current_price, auction_end, status, seller_id, created_at"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const listing = data as ListingDetails;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link href="/auctions" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
            ← Back to auctions
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 lg:col-span-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">{listing.category}</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{listing.title}</h1>
            <p className="mt-4 whitespace-pre-wrap text-slate-300">{listing.description}</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs text-slate-400">Starting Price</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {formatPrice(listing.starting_price)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs text-slate-400">Current Price</p>
                <p className="mt-2 text-xl font-semibold text-cyan-300">
                  {formatPrice(listing.current_price)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs text-slate-400">Auction End</p>
                <p className="mt-2 text-sm font-medium text-slate-200">{formatDate(listing.auction_end)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs text-slate-400">Status</p>
                <p className="mt-2 text-sm font-medium uppercase tracking-wide text-emerald-300">
                  {listing.status}
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-white">Place Bid</h2>
            <p className="mt-2 text-sm text-slate-300">Current highest bid: {formatPrice(listing.current_price)}</p>

            {!user ? (
              <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                You must be signed in to place a bid.{" "}
                <Link href="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">
                  Sign in
                </Link>
              </div>
            ) : (
              <BidForm
                listingId={listing.id}
                currentPrice={listing.current_price}
                sellerId={listing.seller_id}
                auctionEnd={listing.auction_end}
                bidderId={user.id}
                listingStatus={listing.status}
              />
            )}

            <div className="mt-8 space-y-2 rounded-xl border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-400">
              <p>Listing ID: {listing.id}</p>
              <p>Seller ID: {listing.seller_id}</p>
              <p>Created: {formatDate(listing.created_at)}</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
