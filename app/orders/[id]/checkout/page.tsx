import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { GobidMeLogo } from "@/components/gobidme-logo";
import { CheckoutPayButton } from "@/components/checkout-pay-button";
import { ListingCover } from "@/components/listing-cover";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ShippingAddressDisplay } from "@/components/shipping-address-display";
import { formatListingPrice } from "@/lib/listing-price";
import { getBuyerOrderById } from "@/lib/orders";
import {
  canBuyerPayOrder,
  isOrderPaymentComplete,
} from "@/lib/order-payments";
import { PROFILE_SELECT } from "@/lib/profiles";
import { btnSecondary, card, pageShell } from "@/lib/ui-theme";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CheckoutPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Checkout",
    description: `Complete payment for order ${id.slice(0, 8)} on GoBidMe.`,
  };
}

export default async function OrderCheckoutPage({ params }: CheckoutPageProps) {
  noStore();
  const { id: orderId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/orders/${orderId}/checkout`)}`);
  }

  const order = await getBuyerOrderById(supabase, orderId, user.id);
  if (!order) {
    notFound();
  }

  const { data: sellerProfile } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", order.sellerId)
    .maybeSingle();

  const isPaid = isOrderPaymentComplete(order.paymentStatus);
  const canPay = canBuyerPayOrder({
    paymentStatus: order.paymentStatus,
    orderStatus: order.status,
  });

  return (
    <main className={pageShell}>
      <header className="sticky top-0 z-30 border-b border-border/80 bg-page/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <GobidMeLogo />
          <Link href="/orders" className={btnSecondary}>
            ← Orders
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-2xl px-5 py-10 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Checkout</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Complete payment
        </h1>
        <p className="mt-2 text-sm text-muted">
          Review your order and pay securely to release fulfillment to the seller.
        </p>

        <div className={`${card} mt-8 overflow-hidden`}>
          <div className="flex flex-col sm:flex-row">
            <div className="relative aspect-[16/10] w-full shrink-0 bg-page-dark sm:w-48 sm:aspect-auto sm:min-h-[160px]">
              <ListingCover src={order.coverUrl} alt={order.title} className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-ink">{order.title}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <OrderStatusBadge status={order.status} size="sm" />
                <PaymentStatusBadge status={order.paymentStatus} size="sm" />
              </div>
              <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-muted">
                Amount due
              </p>
              <p className="text-3xl font-semibold tabular-nums text-accent">
                {formatListingPrice(order.finalPrice)}
              </p>
            </div>
          </div>
        </div>

        <div className={`${card} mt-4 space-y-5 p-5 sm:p-6`}>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Seller</p>
            <div className="mt-2 flex items-center gap-3">
              <ProfileAvatar profile={sellerProfile} size="sm" />
              <div>
                <p className="text-sm font-semibold text-ink">{order.sellerName}</p>
                {order.sellerUsername ? (
                  <p className="text-xs text-muted">@{order.sellerUsername}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Shipping address
            </p>
            <div className="mt-2">
              {order.shippingAddress ? (
                <ShippingAddressDisplay address={order.shippingAddress} />
              ) : (
                <p className="rounded-2xl border border-dashed border-border bg-page-dark/60 px-4 py-3 text-sm text-muted">
                  No shipping address on file.{" "}
                  <Link href="/orders" className="text-accent hover:underline">
                    Add one on your orders page
                  </Link>{" "}
                  before paying.
                </p>
              )}
            </div>
          </div>

          {isPaid ? (
            <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-4">
              <p className="text-sm font-semibold text-accent">This order is already paid</p>
              {order.paymentReference ? (
                <p className="mt-2 font-mono text-xs text-muted">
                  Reference: {order.paymentReference}
                </p>
              ) : null}
              {order.paidAt ? (
                <p className="mt-1 text-xs text-muted">
                  Paid {new Date(order.paidAt).toLocaleString()}
                </p>
              ) : null}
              <Link href="/orders" className={`${btnSecondary} mt-4 inline-flex`}>
                Back to orders
              </Link>
            </div>
          ) : (
            <CheckoutPayButton orderId={order.orderId} disabled={!canPay} />
          )}
        </div>
      </section>
    </main>
  );
}
