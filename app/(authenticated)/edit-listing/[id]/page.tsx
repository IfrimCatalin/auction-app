import { notFound, redirect } from "next/navigation";
import { AuthenticatedSection } from "@/components/authenticated-layout";
import { EditListingForm } from "@/components/edit-listing-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
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

  if (!user) return null;

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
    <AuthenticatedSection>
      <PageHeader
        eyebrow="Seller"
        title="Edit listing"
        description="Update details and photos. Starting price, duration, and bids cannot be changed."
        actions={
          <ButtonLink href={`/auctions/${id}`} variant="secondary" size="sm">
            ← Back to listing
          </ButtonLink>
        }
      />

      <Card padding="lg" hover={false} className="mt-8 max-w-2xl">
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
      </Card>
    </AuthenticatedSection>
  );
}
