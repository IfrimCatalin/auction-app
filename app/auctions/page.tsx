import Link from "next/link";
import { GobidMeLogo } from "@/components/gobidme-logo";
import { AuctionListingCard } from "@/components/auction-listing-card";
import { getFavoritedListingIds, isListingFavorited } from "@/lib/favorites";
import { LISTING_CATEGORY_OPTIONS } from "@/lib/listing-form";
import { LISTING_IMAGES_SELECT, type ListingImageRow } from "@/lib/listing-images";
import { createClient } from "@/lib/supabase/server";

type ListingCard = {
  id: string;
  seller_id: string;
  title: string;
  category: string;
  current_price: number;
  auction_end: string;
  status: string;
  image_url: string | null;
  listing_images: ListingImageRow[] | null;
};

type AuctionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const SORT_OPTIONS = {
  ending_soon: "Ending soon",
  newest: "Newest",
  price_asc: "Price low to high",
  price_desc: "Price high to low",
} as const;

const STATUS_OPTIONS = {
  all: "All statuses",
  active: "Active",
  ended: "Ended",
} as const;

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function AuctionsPage({ searchParams }: AuctionsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rawSearch = readParam(params.q).trim();
  const rawCategory = readParam(params.category);
  const rawStatus = readParam(params.status);
  const rawSort = readParam(params.sort);

  const selectedCategory = (LISTING_CATEGORY_OPTIONS as readonly string[]).includes(rawCategory)
    ? rawCategory
    : "all";
  const selectedStatus = Object.keys(STATUS_OPTIONS).includes(rawStatus) ? rawStatus : "active";
  const selectedSort = Object.keys(SORT_OPTIONS).includes(rawSort) ? rawSort : "ending_soon";

  let query = supabase
    .from("listings")
    .select(
      `id, seller_id, title, category, current_price, auction_end, status, image_url, listing_images (${LISTING_IMAGES_SELECT})`
    );

  if (rawSearch) {
    const safeSearch = rawSearch.replace(/,/g, " ").trim();
    query = query.or(`title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`);
  }

  if (selectedCategory !== "all") {
    query = query.eq("category", selectedCategory);
  }

  if (selectedStatus !== "all") {
    query = query.eq("status", selectedStatus);
  }

  switch (selectedSort) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "price_asc":
      query = query.order("current_price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("current_price", { ascending: false });
      break;
    case "ending_soon":
    default:
      query = query.order("auction_end", { ascending: true });
      break;
  }

  const { data, error } = await query;

  const listings = (data ?? []) as ListingCard[];
  const favoritedIds = user ? await getFavoritedListingIds(supabase, user.id) : new Set<string>();
  const hasFilters =
    Boolean(rawSearch) || selectedCategory !== "all" || selectedStatus !== "active";

  return (
    <main className="min-h-screen bg-page text-ink">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-page/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <GobidMeLogo />
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/watchlist"
                  className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-page-dark sm:inline-flex"
                >
                  Watchlist
                </Link>
                <Link
                  href="/notifications"
                  className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-page-dark sm:inline-flex"
                >
                  Notifications
                </Link>
              </>
            ) : null}
            <Link
              href="/create-listing"
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-black transition hover:bg-accent/90"
            >
              Sell an item
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 lg:px-8 lg:pt-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Live auctions</h1>
            <p className="mt-2 text-sm text-muted">
              Browse listings from sellers around the community.
            </p>
          </div>
          <Link
            href="/"
            className="hidden text-sm font-medium text-muted transition hover:text-ink sm:inline"
          >
            ← Home
          </Link>
        </div>

        <form method="get" className="mb-8 rounded-3xl border border-border bg-surface p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                Search
              </span>
              <input
                type="search"
                name="q"
                defaultValue={rawSearch}
                placeholder="Search title or description"
                className="w-full rounded-2xl border border-border bg-page-dark px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-accent"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                Category
              </span>
              <select
                name="category"
                defaultValue={selectedCategory}
                className="w-full rounded-2xl border border-border bg-page-dark px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent"
              >
                <option value="all">All categories</option>
                {LISTING_CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                Status
              </span>
              <select
                name="status"
                defaultValue={selectedStatus}
                className="w-full rounded-2xl border border-border bg-page-dark px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent"
              >
                {Object.entries(STATUS_OPTIONS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                Sort
              </span>
              <select
                name="sort"
                defaultValue={selectedSort}
                className="w-full rounded-2xl border border-border bg-page-dark px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent"
              >
                {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
              <button
                type="submit"
                className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-black transition hover:bg-accent/90 lg:w-auto"
              >
                Apply
              </button>
              {hasFilters ? (
                <Link
                  href="/auctions"
                  className="whitespace-nowrap rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium text-ink/90 transition hover:bg-page-dark"
                >
                  Reset
                </Link>
              ) : null}
            </div>
          </div>
        </form>

        {error ? (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-950/40 px-5 py-4 text-sm text-rose-300">
            Could not load auctions: {error.message}
          </div>
        ) : null}

        {listings.length === 0 && !error ? (
          <div className="rounded-3xl border border-border bg-surface p-10 text-center text-sm text-muted">
            {hasFilters ? (
              "No auctions match your current filters."
            ) : (
              <>
                No live auctions yet. Be the first to{" "}
                <Link href="/create-listing" className="font-medium text-ink underline">
                  create a listing
                </Link>
                .
              </>
            )}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <AuctionListingCard
              key={listing.id}
              listing={listing}
              favorited={isListingFavorited(favoritedIds, listing.id)}
              isAuthenticated={Boolean(user)}
              userId={user?.id}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
