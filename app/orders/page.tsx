import type { Metadata } from "next";
import { Suspense } from "react";
import { GobidMeLogo } from "@/components/gobidme-logo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { LogoutButton } from "@/components/logout-button";
import { OrdersPageTabs } from "@/components/orders-page-tabs";
import { SellerOrderCard } from "@/components/seller-order-card";
import { WonAuctionOrderCard } from "@/components/won-auction-order-card";
import { PROFILE_SELECT } from "@/lib/profiles";
import { getBuyerOrders, getSellerOrders } from "@/lib/orders";
import { getConversationsForUser, getTotalUnreadCount } from "@/lib/messages";
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

  if (!user) {
    redirect("/login");
  }

  await expirePastDueListings(supabase);
  const [buyerOrders, sellerOrders] = await Promise.all([
    getBuyerOrders(supabase, user.id),
    getSellerOrders(supabase, user.id),
  ]);
  const conversations = await getConversationsForUser(supabase, user.id);
  const unreadMessages = getTotalUnreadCount(conversations);

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
    <main className="min-h-screen bg-page text-ink">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-page/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <GobidMeLogo />
          <div className="flex items-center gap-2">
            <Link
              href="/messages"
              className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-page-dark sm:inline-flex"
            >
              Messages
              {unreadMessages > 0 ? ` (${unreadMessages})` : ""}
            </Link>
            <Link
              href="/dashboard"
              className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-page-dark sm:inline-flex"
            >
              Dashboard
            </Link>
            <Link
              href="/my-listings"
              className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-page-dark sm:inline-flex"
            >
              My Listings
            </Link>
            <LogoutButton />
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 lg:px-8 lg:pt-14">
        <div>
          <p className="text-sm font-medium text-muted">Orders</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Your orders</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Pay for wins, fulfill sales, track shipments, and confirm delivery.
          </p>
        </div>

        <Suspense fallback={<div className="mt-6 h-10" />}>
          <OrdersPageTabs purchaseCount={buyerOrders.length} salesCount={sellerOrders.length} />
        </Suspense>

        {tab === "sales" ? (
          sellerOrders.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-border bg-surface p-10 text-center">
              <p className="text-sm font-medium text-ink">No sales yet</p>
              <p className="mt-2 text-sm text-muted">
                When a buyer wins your auction, the order appears here for fulfillment.
              </p>
              <Link
                href="/my-listings"
                className="mt-6 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-black transition hover:bg-accent/90"
              >
                My listings
              </Link>
            </div>
          ) : (
            <ul className="mt-8 space-y-4">
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
          <div className="mt-10 rounded-3xl border border-border bg-surface p-10 text-center">
            <p className="text-sm font-medium text-ink">No purchases yet</p>
            <p className="mt-2 text-sm text-muted">
              When you win an ended auction, it appears here with payment and tracking.
            </p>
            <Link
              href="/auctions"
              className="mt-6 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-black transition hover:bg-accent/90"
            >
              Browse auctions
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
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
      </section>
    </main>
  );
}
