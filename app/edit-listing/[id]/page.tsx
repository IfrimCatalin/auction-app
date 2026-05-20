import Link from "next/link";
import { GobidMeLogo } from "@/components/gobidme-logo";
import { notFound, redirect } from "next/navigation";
import { EditListingForm } from "@/components/edit-listing-form";
import {
  LISTING_IMAGES_SELECT_WITH_ID,
  sortListingImages,
  type ListingImageRowWithId,
} from "@/lib/listing-images";
import { createClient } from "@/lib/supabase/server";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("listings")
    .select(
      `id, title, description, category, starting_price, auction_end, reserve_price, seller_id, listing_images (${LISTING_IMAGES_SELECT_WITH_ID}), bids(count)`
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  if (data.seller_id !== user.id) {
    redirect(`/auctions/${id}`);
  }

  const images = sortListingImages(
    (data.listing_images ?? []) as ListingImageRowWithId[]
  ) as ListingImageRowWithId[];
  const bidCount = Array.isArray(data.bids) ? (data.bids[0]?.count ?? 0) : 0;

  return (
    <main className="min-h-screen bg-page text-ink">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-page/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <GobidMeLogo />
          <Link
            href={`/auctions/${id}`}
            className="text-sm font-medium text-muted transition hover:text-ink"
          >
            ← Back to listing
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-2xl px-5 py-10 lg:px-8 lg:py-14">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Edit listing</h1>
        <p className="mt-2 text-sm text-muted">
          Update details and photos. Starting price, auction duration, and bids cannot be changed. Reserve can only be edited before the first bid.
        </p>

        <div className="mt-8 rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <EditListingForm
            listingId={data.id}
            sellerId={user.id}
            initial={{
              title: data.title,
              description: data.description,
              category: data.category,
              auctionEnd: data.auction_end,
              startingPrice: data.starting_price,
              reservePrice: data.reserve_price,
              bidCount,
              images,
            }}
          />
        </div>
      </section>
    </main>
  );
}
