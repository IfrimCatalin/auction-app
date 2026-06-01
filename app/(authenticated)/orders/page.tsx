import type { Metadata } from "next";
import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { AuthenticatedSection } from "@/components/authenticated-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { OrdersPageTabs } from "@/components/orders-page-tabs";
import { SellerOrderCard } from "@/components/seller-order-card";
import { WonAuctionOrderCard } from "@/components/won-auction-order-card";
import { PROFILE_SELECT } from "@/lib/profiles";
import { getBuyerOrders, getSellerOrders } from "@/lib/orders";
import { getShippingAddressesByListingIds } from "@/lib/shipping-addresses";
import { expirePastDueListings } from "@/lib/expire-listings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Orders",
  description: "Manage purchases and sales on GoBidMe.",
};

export const dynamic = "force-dynamic";

type OrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readTab(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "sales" ? "sales" : "purchases";
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  noStore();
  const params = await searchParams;
  const tab = readTab(params.tab);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  await expirePastDueListings(supabase);
  const [buyerOrders, sellerOrders] = await Promise.all([
    getBuyerOrders(supabase, user.id),
    getSellerOrders(supabase, user.id),
  ]);

  const sellerIds = [...new Set(buyerOrders.map((order) => order.sellerId))];
  const { data: sellerProfilesData } =
    sellerIds.length > 0
      ? await supabase.from("profiles").select(PROFILE_SELECT).in("id", sellerIds)
      : { data: [] };

  const sellerProfileById = new Map(
    (sellerProfilesData ?? []).map((profile) => [
      profile.id as string,
      profile as {
        username: string | null;
        full_name: string | null;
        avatar_url: string | null;
      },
    ])
  );

  const sellerListingIds = sellerOrders.map((item) => item.order.listing_id);
  const shippingByListingId = await getShippingAddressesByListingIds(
    supabase,
    sellerListingIds
  );

  return (
    <AuthenticatedSection>
      <PageHeader
        eyebrow="Orders"
        title="Your orders"
        description="Pay for wins, fulfill sales, track shipments, and confirm delivery."
      />

      <Suspense fallback={<div className="mt-6 h-12 animate-pulse rounded-2xl bg-elevated" />}>
        <OrdersPageTabs purchaseCount={buyerOrders.length} salesCount={sellerOrders.length} />
      </Suspense>

      {tab === "sales" ? (
        sellerOrders.length === 0 ? (
          <EmptyState
            className="mt-10"
            title="No sales yet"
            description="When a buyer wins your auction, the order appears here for fulfillment."
            actionLabel="My listings"
            actionHref="/my-listings"
          />
        ) : (
          <ul className="mt-8 space-y-5">
            {sellerOrders.map((sellerOrder) => (
              <li key={sellerOrder.order.id}>
                <SellerOrderCard
                  sellerOrder={sellerOrder}
                  shippingAddress={
                    shippingByListingId.get(sellerOrder.order.listing_id) ?? null
                  }
                />
              </li>
            ))}
          </ul>
        )
      ) : buyerOrders.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="No purchases yet"
          description="When you win an ended auction, it appears here with payment and tracking."
          actionLabel="Browse auctions"
          actionHref="/auctions"
        />
      ) : (
        <ul className="mt-8 space-y-5">
          {buyerOrders.map((order) => (
            <li key={order.orderId}>
              <WonAuctionOrderCard
                order={order}
                userId={user.id}
                sellerProfile={sellerProfileById.get(order.sellerId) ?? null}
              />
            </li>
          ))}
        </ul>
      )}
    </AuthenticatedSection>
  );
}
