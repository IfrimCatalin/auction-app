import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfileDisplayName, PROFILE_SELECT } from "@/lib/profiles";

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

export type ConversationRow = {
  id: string;
  listing_id: string;
  order_id: string | null;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
};

export type ConversationListItem = {
  id: string;
  listingId: string;
  listingTitle: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  isBuyer: boolean;
};

type ConversationWithListing = ConversationRow & {
  listings:
    | { id: string; title: string }
    | { id: string; title: string }[]
    | null;
};

type MessagePreviewRow = {
  conversation_id: string;
  content: string;
  created_at: string;
  sender_id: string;
};

function normalizeListingJoin(
  listings: ConversationWithListing["listings"]
): { id: string; title: string } | null {
  if (!listings) return null;
  return Array.isArray(listings) ? (listings[0] ?? null) : listings;
}

export async function getOrCreateConversationId(
  supabase: SupabaseClient,
  listingId: string,
  buyerId?: string
): Promise<{ conversationId: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc("get_or_create_conversation", {
    p_listing_id: listingId,
    p_buyer_id: buyerId ?? null,
  });

  if (error) {
    return { conversationId: null, error: error.message };
  }

  return { conversationId: data as string, error: null };
}

export async function getConversationsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<ConversationListItem[]> {
  const { data: conversations, error } = await supabase
    .from("conversations")
    .select(
      "id, listing_id, order_id, buyer_id, seller_id, created_at, updated_at, last_message_at, listings ( id, title )"
    )
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error || !conversations?.length) {
    if (error) console.error("[getConversationsForUser]", error.message);
    return [];
  }

  const rows = conversations as ConversationWithListing[];
  const conversationIds = rows.map((row) => row.id);
  const otherUserIds = rows.map((row) =>
    row.buyer_id === userId ? row.seller_id : row.buyer_id
  );

  const [{ data: profiles }, { data: latestMessages }, { data: unreadRows }] =
    await Promise.all([
      supabase.from("profiles").select(PROFILE_SELECT).in("id", [...new Set(otherUserIds)]),
      supabase
        .from("messages")
        .select("conversation_id, content, created_at, sender_id")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", conversationIds)
        .neq("sender_id", userId)
        .is("read_at", null),
    ]);

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id as string, profile])
  );

  const latestByConversation = new Map<string, MessagePreviewRow>();
  for (const message of (latestMessages ?? []) as MessagePreviewRow[]) {
    if (!latestByConversation.has(message.conversation_id)) {
      latestByConversation.set(message.conversation_id, message);
    }
  }

  const unreadByConversation = new Map<string, number>();
  for (const row of unreadRows ?? []) {
    const id = row.conversation_id as string;
    unreadByConversation.set(id, (unreadByConversation.get(id) ?? 0) + 1);
  }

  const items: ConversationListItem[] = [];

  for (const row of rows) {
    const listing = normalizeListingJoin(row.listings);
    if (!listing) continue;

    const isBuyer = row.buyer_id === userId;
    const otherUserId = isBuyer ? row.seller_id : row.buyer_id;
    const profile = profileById.get(otherUserId);
    const latest = latestByConversation.get(row.id);

    items.push({
      id: row.id,
      listingId: row.listing_id,
      listingTitle: listing.title,
      otherUserId,
      otherUserName: getProfileDisplayName(profile, isBuyer ? "Seller" : "Buyer"),
      otherUserAvatarUrl: (profile?.avatar_url as string | null) ?? null,
      lastMessagePreview: latest?.content ?? null,
      lastMessageAt: row.last_message_at ?? latest?.created_at ?? row.created_at,
      unreadCount: unreadByConversation.get(row.id) ?? 0,
      isBuyer,
    });
  }

  return items;
}

export async function getConversationForUser(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string
): Promise<ConversationListItem | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, listing_id, order_id, buyer_id, seller_id, created_at, updated_at, last_message_at, listings ( id, title )"
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[getConversationForUser]", error.message);
    return null;
  }

  const row = data as ConversationWithListing;
  if (row.buyer_id !== userId && row.seller_id !== userId) {
    return null;
  }

  const listing = normalizeListingJoin(row.listings);
  if (!listing) return null;

  const isBuyer = row.buyer_id === userId;
  const otherUserId = isBuyer ? row.seller_id : row.buyer_id;

  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", otherUserId)
    .maybeSingle();

  const { data: latest } = await supabase
    .from("messages")
    .select("content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);

  return {
    id: row.id,
    listingId: row.listing_id,
    listingTitle: listing.title,
    otherUserId,
    otherUserName: getProfileDisplayName(profile, isBuyer ? "Seller" : "Buyer"),
    otherUserAvatarUrl: (profile?.avatar_url as string | null) ?? null,
    lastMessagePreview: latest?.content ?? null,
    lastMessageAt: row.last_message_at ?? latest?.created_at ?? row.created_at,
    unreadCount: count ?? 0,
    isBuyer,
  };
}

export async function getMessagesForConversation(
  supabase: SupabaseClient,
  conversationId: string
): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at, read_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getMessagesForConversation]", error.message);
    return [];
  }

  return (data ?? []) as MessageRow[];
}

export async function markConversationRead(
  supabase: SupabaseClient,
  conversationId: string
): Promise<void> {
  const { error } = await supabase.rpc("mark_conversation_read", {
    p_conversation_id: conversationId,
  });

  if (error) {
    console.error("[markConversationRead]", error.message);
  }
}

export function formatMessageTime(iso: string, now = Date.now()) {
  const date = new Date(iso);
  const diffMs = now - date.getTime();
  const oneDay = 86_400_000;

  if (diffMs < oneDay && new Date(now).toDateString() === date.toDateString()) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  if (diffMs < 7 * oneDay) {
    return date.toLocaleDateString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getTotalUnreadCount(conversations: ConversationListItem[]) {
  return conversations.reduce((sum, item) => sum + item.unreadCount, 0);
}
