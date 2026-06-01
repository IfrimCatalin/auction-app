"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function payOrderAction(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in to complete payment." };
  }

  const { data, error } = await supabase.rpc("pay_order", {
    p_order_id: orderId,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const order = data as { listing_id?: string; payment_reference?: string | null };

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}/checkout`);
  if (order?.listing_id) {
    revalidatePath(`/auctions/${order.listing_id}`);
  }

  return {
    ok: true,
    paymentReference: order?.payment_reference ?? null,
  };
}

function revalidateOrderPaths(orderId: string, listingId?: string) {
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}/checkout`);
  revalidatePath("/my-listings");
  revalidatePath("/dashboard");
  if (listingId) {
    revalidatePath(`/auctions/${listingId}`);
  }
}

export async function sellerMarkPreparingShipmentAction(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const { data, error } = await supabase.rpc("seller_mark_preparing_shipment", {
    p_order_id: orderId,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const order = data as { listing_id?: string };
  revalidateOrderPaths(orderId, order?.listing_id);
  return { ok: true };
}

export async function sellerMarkShippedAction(
  orderId: string,
  trackingNumber: string,
  shippingCarrier: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const { data, error } = await supabase.rpc("seller_mark_shipped", {
    p_order_id: orderId,
    p_tracking_number: trackingNumber,
    p_shipping_carrier: shippingCarrier,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const order = data as { listing_id?: string };
  revalidateOrderPaths(orderId, order?.listing_id);
  return { ok: true };
}

export async function buyerConfirmDeliveryAction(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const { data, error } = await supabase.rpc("buyer_confirm_delivery", {
    p_order_id: orderId,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const order = data as { listing_id?: string };
  revalidateOrderPaths(orderId, order?.listing_id);
  return { ok: true };
}
