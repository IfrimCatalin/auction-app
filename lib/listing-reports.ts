import type { SupabaseClient } from "@supabase/supabase-js";

export const LISTING_REPORT_REASONS = [
  { value: "scam", label: "Scam or fraud" },
  { value: "counterfeit", label: "Counterfeit or fake item" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "wrong_category", label: "Wrong category" },
  { value: "suspicious_seller", label: "Suspicious seller" },
  { value: "other", label: "Other" },
] as const;

export type ListingReportReason = (typeof LISTING_REPORT_REASONS)[number]["value"];

export type ListingReportStatus = "pending" | "reviewed" | "resolved";

export type ListingReportRow = {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: ListingReportReason;
  message: string | null;
  status: ListingReportStatus;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
};

export function getListingReportReasonLabel(reason: string) {
  return (
    LISTING_REPORT_REASONS.find((item) => item.value === reason)?.label ?? reason
  );
}

export function isListingReportReason(value: string): value is ListingReportReason {
  return LISTING_REPORT_REASONS.some((item) => item.value === value);
}

export async function getUserListingReport(
  supabase: SupabaseClient,
  listingId: string,
  userId: string
): Promise<Pick<ListingReportRow, "id" | "status" | "reason" | "created_at"> | null> {
  const { data, error } = await supabase
    .from("listing_reports")
    .select("id, status, reason, created_at")
    .eq("listing_id", listingId)
    .eq("reporter_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[getUserListingReport]", error.message);
    return null;
  }

  return data;
}

export async function getAdminListingReports(
  supabase: SupabaseClient,
  limit = 25
): Promise<
  Array<
    ListingReportRow & {
      listings: {
        id: string;
        title: string;
        status: string;
        is_hidden: boolean;
        seller_id: string;
      } | null;
    }
  >
> {
  const { data, error } = await supabase
    .from("listing_reports")
    .select(
      "id, listing_id, reporter_id, reason, message, status, created_at, updated_at, reviewed_at, listings ( id, title, status, is_hidden, seller_id )"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getAdminListingReports]", error.message);
    return [];
  }

  type AdminReportRow = ListingReportRow & {
    listings:
      | {
          id: string;
          title: string;
          status: string;
          is_hidden: boolean;
          seller_id: string;
        }
      | {
          id: string;
          title: string;
          status: string;
          is_hidden: boolean;
          seller_id: string;
        }[]
      | null;
  };

  const statusOrder: Record<ListingReportStatus, number> = {
    pending: 0,
    reviewed: 1,
    resolved: 2,
  };

  return ((data ?? []) as AdminReportRow[])
    .map((row) => {
      const listing = Array.isArray(row.listings) ? (row.listings[0] ?? null) : row.listings;
      return { ...row, listings: listing };
    })
    .sort((a, b) => {
      const byStatus = statusOrder[a.status] - statusOrder[b.status];
      if (byStatus !== 0) return byStatus;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}

export function countPendingListingReports(
  reports: Array<{ status: ListingReportStatus }>
) {
  return reports.filter((report) => report.status === "pending").length;
}
