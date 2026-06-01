import Link from "next/link";
import { AppNavbar } from "@/components/app-navbar";
import { PublicNavbar } from "@/components/public-navbar";
import { AuctionsLiveGrid } from "@/components/auctions-live-grid";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { buildAppNavItems } from "@/lib/app-nav";
import { buttonClasses } from "@/lib/button-variants";
import { container, pageShell } from "@/lib/ui-tokens";
import { getFavoritedListingIds, isListingFavorited } from "@/lib/favorites";
import { LISTING_CATEGORY_OPTIONS } from "@/lib/listing-form";
import { LISTING_IMAGES_SELECT, type ListingImageRow } from "@/lib/listing-images";
import { expirePastDueListings } from "@/lib/expire-listings";
import { getListingReserveStatus } from "@/lib/reserve-price";
import { createClient } from "@/lib/supabase/server";
import {
  sortListingsByVisibilityThenUserSort,
  type ListingSortKey,
} from "@/lib/listing-visibility";

type ListingCard = {
  id: string;
  seller_id: string;
  title: string;
  category: string;
  current_price: number;
  created_at: string;
  auction_end: string;
  status: string;
  reserve_price: number | null;
  image_url: string | null;
  listing_images: ListingImageRow[] | null;
};

type ListingCardWithReserve = ListingCard & {
  reserveStatus: ReturnType<typeof getListingReserveStatus>;
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

  await expirePastDueListings(supabase);

  let query = supabase
    .from("listings")
    .select(
      `id, seller_id, title, category, current_price, created_at, auction_end, status, reserve_price, image_url, listing_images (${LISTING_IMAGES_SELECT})`
    );

  if (rawSearch) {
    const safeSearch = rawSearch.replace(/,/g, " ").trim();
    query = query.or(`title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`);
  }

  if (selectedCategory !== "all") {
    query = query.eq("category", selectedCategory);
  }

  query = query.eq("is_hidden", false).neq("status", "cancelled");

  if (selectedStatus === "active") {
    query = query.eq("status", "active").gt("auction_end", new Date().toISOString());
  } else if (selectedStatus === "ended") {
    query = query.eq("status", "ended");
  }

  const { data, error } = await query;

  const listings: ListingCardWithReserve[] = sortListingsByVisibilityThenUserSort(
    (data ?? []) as ListingCard[],
    selectedSort as ListingSortKey
  ).map((listing) => ({
    ...listing,
    reserveStatus: getListingReserveStatus(listing.reserve_price, listing.current_price),
  }));
  const favoritedIds = user ? await getFavoritedListingIds(supabase, user.id) : new Set<string>();
  const hasFilters =
    Boolean(rawSearch) || selectedCategory !== "all" || selectedStatus !== "active";

  return (
    <main className={pageShell}>
      {user ? (
        <AppNavbar
          isAuthenticated
          items={buildAppNavItems()}
          rightSlot={
            <Link href="/create-listing" className={buttonClasses("primary", "sm")}>
              Sell
            </Link>
          }
        />
      ) : (
        <PublicNavbar isAuthenticated={false} />
      )}

      <section className={`${container} pb-16 pt-8 sm:pt-10 lg:pt-12`}>
        <PageHeader
          title="Live auctions"
          description="Browse listings from sellers around the community."
          actions={<ButtonLink href="/create-listing">Sell an item</ButtonLink>}
        />

        <Card hover={false} padding="lg" className="mb-10 mt-8 border-accent/20">
          <form method="get">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
              <Field label="Search" htmlFor="auction-search">
                <Input
                  id="auction-search"
                  type="search"
                  name="q"
                  defaultValue={rawSearch}
                  placeholder="Search title or description"
                />
              </Field>
              <Field label="Category" htmlFor="auction-category">
                <Select id="auction-category" name="category" defaultValue={selectedCategory}>
                  <option value="all">All categories</option>
                  {LISTING_CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Status" htmlFor="auction-status">
                <Select id="auction-status" name="status" defaultValue={selectedStatus}>
                  {Object.entries(STATUS_OPTIONS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Sort" htmlFor="auction-sort">
                <Select id="auction-sort" name="sort" defaultValue={selectedSort}>
                  {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-1">
                <Button type="submit" size="lg" className="w-full lg:w-auto">
                  Apply filters
                </Button>
                {hasFilters ? (
                  <ButtonLink href="/auctions" variant="secondary" size="md">
                    Reset
                  </ButtonLink>
                ) : null}
              </div>
            </div>
          </form>
        </Card>

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

        <AuctionsLiveGrid
          listings={listings}
          favoritedIds={[...favoritedIds]}
          isAuthenticated={Boolean(user)}
          userId={user?.id}
        />
      </section>
    </main>
  );
}
