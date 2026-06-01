"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getOrCreateConversationId,
  markConversationRead,
} from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";

export async function openConversationFormAction(formData: FormData) {
  const listingId = String(formData.get("listingId") ?? "").trim();
  const buyerIdRaw = formData.get("buyerId");
  const buyerId =
    typeof buyerIdRaw === "string" && buyerIdRaw.trim().length > 0
      ? buyerIdRaw.trim()
      : undefined;

  if (!listingId) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/auctions/${listingId}`)}`);
  }

  const { conversationId, error } = await getOrCreateConversationId(
    supabase,
    listingId,
    buyerId
  );

  if (!conversationId) {
    redirect(
      `/messages?error=${encodeURIComponent(error ?? "Could not start conversation.")}`
    );
  }

  redirect(`/messages?c=${conversationId}`);
}

export async function sendMessageAction(conversationId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { ok: false, error: "Message cannot be empty." };
  }
  if (trimmed.length > 4000) {
    return { ok: false, error: "Message is too long (max 4000 characters)." };
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: trimmed,
    })
    .select("id, conversation_id, sender_id, content, created_at, read_at")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/messages");
  return { ok: true, message: data };
}

export async function markConversationReadAction(conversationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  await markConversationRead(supabase, conversationId);
  revalidatePath("/messages");
  return { ok: true };
}
