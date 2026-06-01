import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getCoverImageUrl,
  LISTING_IMAGES_SELECT,
  type ListingImageRow,
} from "@/lib/listing-images";
import { getProfileDisplayName } from "@/lib/profiles";
import {
  getShippingAddressesForListings,
  type ShippingAddress,
} from "@/lib/shipping-addresses";
import { expirePastDueListings } from "@/lib/expire-listings";

export const ORDER_STATUSES = [
  "awaiting_payment",
  "paid",
  "preparing_shipment",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type Order = {
  id: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  final_price: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
};

export type BuyerOrderView = {
  orderId: string;
  listingId: string;
  title: string;
  coverUrl: string | null;
  finalPrice: number;
  auctionEndedAt: string;
  sellerId: string;
  sellerName: string;
  sellerUsername: string | null;
  status: OrderStatus;
  shippingAddress: ShippingAddress | null;
  updatedAt: string;
};

export type SellerOrderView = {
  order: Order;
  listingTitle: string;
  coverUrl: string | null;
  auctionEndedAt: string;
  buyerLabel: string;
};

const ORDER_SELECT =
  "id, listing_id, seller_id, buyer_id, final_price, status, created_at, updated_at";

type ListingJoin = {
  id: string;
  title: string;
  auction_end: string;
  image_url: string | null;
  listing_images: ListingImageRow[] | null;
};

type OrderWithListing = Order & {
  listings: ListingJoin | ListingJoin[] | null;
};

function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function parseOrderStatus(value: string): OrderStatus {
  return isOrderStatus(value) ? value : "awaiting_payment";
}

export function getOrderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "awaiting_payment":
      return "Awaiting payment";
    case "paid":
      return "Paid";
    case "preparing_shipment":
      return "Preparing shipment";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return "Awaiting payment";
  }
}

export function getOrderStatusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case "awaiting_payment":
      return "border-amber-500/35 bg-amber-950/40 text-amber-200";
    case "paid":
      return "border-accent/40 bg-accent/15 text-accent";
    case "preparing_shipment":
      return "border-border bg-page text-ink";
    case "shipped":
      return "border-accent/35 bg-accent/10 text-accent";
    case "delivered":
      return "border-emerald-500/30 bg-emerald-950/30 text-emerald-200";
    case "cancelled":
      return "border-border bg-page-dark text-muted";
    default:
      return "border-border bg-page-dark text-muted";
  }
}

export const ORDER_PROGRESS_STATUSES: OrderStatus[] = [
  "awaiting_payment",
  "paid",
  "preparing_shipment",
  "shipped",
  "delivered",
];

function getListingFromJoin(row: OrderWithListing): ListingJoin | null {
  const listing = row.listings;
  if (!listing) return null;
  return Array.isArray(listing) ? (listing[0] ?? null) : listing;
}

/** Expires past-due listings and creates orders for valid ended sales. */
export async function ensureAuctionOrdersSynced(supabase: SupabaseClient): Promise<void> {
  await expirePastDueListings(supabase);
}

export async function getBuyerOrders(
  supabase: SupabaseClient,
  buyerId: string
): Promise<BuyerOrderView[]> {
  await ensureAuctionOrdersSynced(supabase);

  const { data, error } = await supabase
    .from("orders")
    .select(
      `${ORDER_SELECT}, listings ( id, title, auction_end, image_url, listing_images (${LISTING_IMAGES_SELECT}) )`
    )
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error || !data?.length) {
    return [];
  }

  const rows = data as OrderWithListing[];
  const listingIds = rows.map((row) => row.listing_id);
  const sellerIds = [...new Set(rows.map((row) => row.seller_id))];

  const [shippingByListingId, profilesResult] = await Promise.all([
    getShippingAddressesForListings(supabase, buyerId, listingIds),
    supabase.from("profiles").select("id, username, full_name").in("id", sellerIds),
  ]);

  const profileById = new Map(
    (profilesResult.data ?? []).map((profile) => [
      profile.id as string,
      profile as { username: string | null; full_name: string | null },
    ])
  );

  return rows
    .map((row) => {
      const listing = getListingFromJoin(row);
      if (!listing) return null;

      const sellerProfile = profileById.get(row.seller_id);
      return {
        orderId: row.id,
        listingId: row.listing_id,
        title: listing.title,
        coverUrl: getCoverImageUrl(listing.image_url, listing.listing_images),
        finalPrice: Number(row.final_price),
        auctionEndedAt: listing.auction_end,
        sellerId: row.seller_id,
        sellerName: getProfileDisplayName(sellerProfile, "Seller"),
        sellerUsername: sellerProfile?.username?.trim() ?? null,
        status: parseOrderStatus(row.status),
        shippingAddress: shippingByListingId.get(row.listing_id) ?? null,
        updatedAt: row.updated_at,
      };
    })
    .filter((order): order is BuyerOrderView => order !== null);
}

export async function getSellerOrders(
  supabase: SupabaseClient,
  sellerId: string
): Promise<SellerOrderView[]> {
  await ensureAuctionOrdersSynced(supabase);

  const { data, error } = await supabase
    .from("orders")
    .select(
      `${ORDER_SELECT}, listings ( id, title, auction_end, image_url, listing_images (${LISTING_IMAGES_SELECT}) )`
    )
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error || !data?.length) {
    return [];
  }

  const rows = data as OrderWithListing[];
  const buyerIds = [...new Set(rows.map((row) => row.buyer_id))];

  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .in("id", buyerIds);

  const profileById = new Map(
    (profilesData ?? []).map((profile) => [
      profile.id as string,
      profile as { username: string | null; full_name: string | null },
    ])
  );

  return rows
    .map((row) => {
      const listing = getListingFromJoin(row);
      if (!listing) return null;

      const buyerProfile = profileById.get(row.buyer_id);
      const username = buyerProfile?.username?.trim();
      const buyerLabel = username
        ? `@${username}`
        : buyerProfile?.full_name?.trim() || "Buyer";

      return {
        order: {
          id: row.id,
          listing_id: row.listing_id,
          seller_id: row.seller_id,
          buyer_id: row.buyer_id,
          final_price: Number(row.final_price),
          status: parseOrderStatus(row.status),
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
        listingTitle: listing.title,
        coverUrl: getCoverImageUrl(listing.image_url, listing.listing_images),
        auctionEndedAt: listing.auction_end,
        buyerLabel,
      };
    })
    .filter((item): item is SellerOrderView => item !== null);
}

export async function getOrdersByListingIds(
  supabase: SupabaseClient,
  listingIds: string[]
): Promise<Map<string, Order>> {
  if (listingIds.length === 0) {
    return new Map();
  }

  await ensureAuctionOrdersSynced(supabase);

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .in("listing_id", listingIds);

  if (error || !data?.length) {
    return new Map();
  }

  return new Map(
    (data as Order[]).map((order) => [
      order.listing_id,
      { ...order, status: parseOrderStatus(order.status) },
    ])
  );
}

export async function getOrderForListing(
  supabase: SupabaseClient,
  listingId: string
): Promise<Order | null> {
  await ensureAuctionOrdersSynced(supabase);

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return { ...(data as Order), status: parseOrderStatus(data.status) };
}
