import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { AuthenticatedSection } from "@/components/authenticated-layout";
import { CheckoutPayButton } from "@/components/checkout-pay-button";
import { ListingCover } from "@/components/listing-cover";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ShippingAddressDisplay } from "@/components/shipping-address-display";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { formatListingPrice } from "@/lib/listing-price";
import { getBuyerOrderById } from "@/lib/orders";
import { canBuyerPayOrder, isOrderPaymentComplete } from "@/lib/order-payments";
import { PROFILE_SELECT } from "@/lib/profiles";
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

  if (!user) return null;

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
    <AuthenticatedSection>
      <PageHeader
        eyebrow="Checkout"
        title="Complete payment"
        description="Review your order and pay to release fulfillment to the seller."
        actions={
          <ButtonLink href="/orders" variant="secondary" size="sm">
            ← Orders
          </ButtonLink>
        }
      />

      <div className="mx-auto mt-8 max-w-2xl space-y-4">
        <Card padding="none" hover={false} className="overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            <div className="relative aspect-[16/10] w-full shrink-0 bg-page-dark sm:aspect-auto sm:min-h-[160px] sm:w-48">
              <ListingCover
                src={order.coverUrl}
                alt={order.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <h2 className="text-lg font-bold text-ink">{order.title}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <OrderStatusBadge status={order.status} size="sm" />
                <PaymentStatusBadge status={order.paymentStatus} size="sm" />
              </div>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-muted">
                Amount due
              </p>
              <p className="text-3xl font-bold tabular-nums text-accent">
                {formatListingPrice(order.finalPrice)}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="lg" hover={false} className="space-y-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Seller</p>
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
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
              Shipping address
            </p>
            <div className="mt-2">
              {order.shippingAddress ? (
                <ShippingAddressDisplay address={order.shippingAddress} />
              ) : (
                <p className="rounded-2xl border-2 border-dashed border-border bg-page-dark px-4 py-3 text-sm text-muted">
                  No shipping address on file.{" "}
                  <Link href="/orders" className="font-semibold text-accent hover:underline">
                    Add one on your orders page
                  </Link>{" "}
                  before paying.
                </p>
              )}
            </div>
          </div>

          {isPaid ? (
            <div className="rounded-2xl border-2 border-accent/40 bg-accent/15 px-4 py-4">
              <p className="text-sm font-semibold text-ink">This order is already paid</p>
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
              <ButtonLink href="/orders" variant="secondary" className="mt-4">
                Back to orders
              </ButtonLink>
            </div>
          ) : (
            <CheckoutPayButton orderId={order.orderId} disabled={!canPay} />
          )}
        </Card>
      </div>
    </AuthenticatedSection>
  );
}
