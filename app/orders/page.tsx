import type { Metadata } from "next";
import { GobidMeLogo } from "@/components/gobidme-logo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { LogoutButton } from "@/components/logout-button";
import { WonAuctionOrderCard } from "@/components/won-auction-order-card";
import { PROFILE_SELECT } from "@/lib/profiles";
import { getBuyerOrders } from "@/lib/orders";
import { expirePastDueListings } from "@/lib/expire-listings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Won auctions",
  description: "View auctions you have won on GoBidMe.",
};

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  noStore();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await expirePastDueListings(supabase);
  const orders = await getBuyerOrders(supabase, user.id);

  const sellerIds = [...new Set(orders.map((order) => order.sellerId))];
  const { data: profilesData } =
    sellerIds.length > 0
      ? await supabase.from("profiles").select(PROFILE_SELECT).in("id", sellerIds)
      : { data: [] };

  const profileById = new Map(
    (profilesData ?? []).map((profile) => [
      profile.id as string,
      profile as {
        username: string | null;
        full_name: string | null;
        avatar_url: string | null;
      },
    ])
  );

  return (
    <main className="min-h-screen bg-page text-ink">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-page/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <GobidMeLogo />
          <div className="flex items-center gap-2">
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
            <Link
              href="/watchlist"
              className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-page-dark sm:inline-flex"
            >
              Watchlist
            </Link>
            <LogoutButton />
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 lg:px-8 lg:pt-14">
        <div>
          <p className="text-sm font-medium text-muted">Buyer</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Your orders</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Track status for auctions you won. Add a delivery address for each order — payment
            and carrier labels will be added soon.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-border bg-surface p-10 text-center">
            <p className="text-sm font-medium text-ink">No won auctions yet</p>
            <p className="mt-2 text-sm text-muted">
              When you win an ended auction, it will appear here with seller details and order
              status.
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
            {orders.map((order) => (
              <li key={order.orderId}>
                <WonAuctionOrderCard
                  order={order}
                  userId={user.id}
                  sellerProfile={profileById.get(order.sellerId) ?? null}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
