"use server";

import { revalidatePath } from "next/cache";
import { isListingReportReason } from "@/lib/listing-reports";
import { createClient } from "@/lib/supabase/server";

export async function submitListingReportAction(input: {
  listingId: string;
  reason: string;
  message?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in to report this listing." };
  }

  if (!isListingReportReason(input.reason)) {
    return { ok: false, error: "Choose a valid report reason." };
  }

  const trimmedMessage = input.message?.trim() ?? "";
  if (trimmedMessage.length > 1000) {
    return { ok: false, error: "Message must be 1000 characters or fewer." };
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("seller_id")
    .eq("id", input.listingId)
    .maybeSingle();

  if (listingError || !listing) {
    return { ok: false, error: "Listing not found." };
  }

  if (listing.seller_id === user.id) {
    return { ok: false, error: "You cannot report your own listing." };
  }

  const { error } = await supabase.from("listing_reports").insert({
    listing_id: input.listingId,
    reporter_id: user.id,
    reason: input.reason,
    message: trimmedMessage.length > 0 ? trimmedMessage : null,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You already reported this listing." };
    }
    if (error.message.toLowerCase().includes("cannot report your own")) {
      return { ok: false, error: "You cannot report your own listing." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath(`/auctions/${input.listingId}`);
  revalidatePath("/admin");
  return { ok: true };
}
