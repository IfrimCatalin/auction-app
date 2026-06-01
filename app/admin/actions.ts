"use server";

import { revalidatePath } from "next/cache";
import { isUserAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

async function requireAdminAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, ok: false as const, error: "Sign in required." };
  }

  if (!(await isUserAdmin(supabase, user.id))) {
    return { supabase, ok: false as const, error: "Admin access required." };
  }

  return { supabase, ok: true as const, user };
}

export async function adminCancelListingAction(listingId: string) {
  const gate = await requireAdminAction();
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }

  const { error } = await gate.supabase.rpc("admin_cancel_listing", {
    p_listing_id: listingId,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/auctions");
  revalidatePath(`/auctions/${listingId}`);
  return { ok: true };
}

export async function adminSetListingHiddenAction(listingId: string, hidden: boolean) {
  const gate = await requireAdminAction();
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }

  const { error } = await gate.supabase.rpc("admin_set_listing_hidden", {
    p_listing_id: listingId,
    p_hidden: hidden,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/auctions");
  revalidatePath(`/auctions/${listingId}`);
  return { ok: true };
}

export async function adminSetListingReportStatusAction(
  reportId: string,
  status: "reviewed" | "resolved"
) {
  const gate = await requireAdminAction();
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }

  const { error } = await gate.supabase.rpc("admin_set_listing_report_status", {
    p_report_id: reportId,
    p_status: status,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true };
}
