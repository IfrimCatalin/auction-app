import type { Metadata } from "next";
import { GobidMeLogo } from "@/components/gobidme-logo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfileAvatar } from "@/components/profile-avatar";
import { SellerListingsGrid, type SellerListingCard } from "@/components/seller-listings-grid";
import { LISTING_IMAGES_SELECT } from "@/lib/listing-images";
import { getProfileById } from "@/lib/profile-server";
import { getProfileDisplayName } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getProfileById(supabase, id);
  const name = getProfileDisplayName(profile, "Seller");

  return {
    title: name,
    description: `View ${name}'s active listings on GoBidMe.`,
  };
}

export default async function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(id)) {
    notFound();
  }

  const profile = await getProfileById(supabase, id);
  const displayName = getProfileDisplayName(profile, "GoBidMe seller");

  const { data: listingsData } = await supabase
    .from("listings")
    .select(
      `id, title, category, current_price, auction_end, image_url, listing_images (${LISTING_IMAGES_SELECT})`
    )
    .eq("seller_id", id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const listings = (listingsData ?? []) as SellerListingCard[];

  return (
    <main className="min-h-screen bg-page text-ink">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-page/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <GobidMeLogo />
          <Link
            href="/auctions"
            className="text-sm font-medium text-muted transition hover:text-ink"
          >
            ← All auctions
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <ProfileAvatar profile={profile} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Seller</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                {displayName}
              </h1>
              {profile?.username ? (
                <p className="mt-1 text-sm text-muted">@{profile.username}</p>
              ) : null}
              {profile?.location ? (
                <p className="mt-3 text-sm text-muted">{profile.location}</p>
              ) : null}
              {profile?.bio ? (
                <p className="mt-4 max-w-2xl whitespace-pre-wrap text-[15px] leading-relaxed text-ink/90">
                  {profile.bio}
                </p>
              ) : (
                <p className="mt-4 text-sm text-muted">
                  This seller hasn&apos;t added a bio yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Active listings</h2>
          <p className="mt-1 text-sm text-muted">
            {listings.length === 0
              ? "No live auctions from this seller."
              : `${listings.length} live auction${listings.length === 1 ? "" : "s"}`}
          </p>
          <div className="mt-6">
            <SellerListingsGrid listings={listings} />
          </div>
        </div>
      </section>
    </main>
  );
}
