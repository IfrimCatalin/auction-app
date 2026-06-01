import Link from "next/link";
import { AuthenticatedSection } from "@/components/authenticated-layout";
import { AdminDashboardSection } from "@/components/admin-dashboard-section";
import { PageHeader } from "@/components/ui/page-header";
import { AdminListingActions } from "@/components/admin-listing-actions";
import { AdminReportActions } from "@/components/admin-report-actions";
import { getProfileDisplayName } from "@/lib/profiles";
import {
  countPendingListingReports,
  getAdminListingReports,
  getListingReportReasonLabel,
  type ListingReportStatus,
} from "@/lib/listing-reports";
import { cardBase, sectionMuted } from "@/lib/ui-tokens";
import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

function formatWhen(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function reportStatusBadgeClass(status: ListingReportStatus) {
  if (status === "pending") return "bg-amber-500/15 text-amber-200 border-amber-500/30";
  if (status === "reviewed") return "bg-sky-500/15 text-sky-200 border-sky-500/30";
  return "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
}

function statusBadgeClass(status: string, isHidden: boolean) {
  if (isHidden) return "bg-amber-500/15 text-amber-200 border-amber-500/30";
  if (status === "cancelled") return "bg-red-500/15 text-red-200 border-red-500/30";
  if (status === "active") return "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
  return "bg-page-dark text-muted border-border";
}

export default async function AdminPage() {
  noStore();
  const supabase = await createClient();

  const [listingsRes, profilesRes, bidsRes] = await Promise.all([
    supabase
      .from("listings")
      .select("id, title, status, is_hidden, current_price, created_at, seller_id")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("profiles")
      .select("id, username, full_name, created_at")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("bids")
      .select("id, listing_id, bidder_id, amount, created_at")
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const listings = listingsRes.data ?? [];
  const profiles = profilesRes.data ?? [];
  const bids = bidsRes.data ?? [];
  const reports = await getAdminListingReports(supabase, 25);
  const pendingReportCount = countPendingListingReports(reports);

  const listingTitleById = new Map(listings.map((row) => [row.id, row.title]));

  return (
    <AuthenticatedSection>
      <PageHeader
        eyebrow="Moderation"
        title="Admin dashboard"
        description="Review marketplace activity, cancel listings, or hide them from public auctions."
      />

      <div className="mt-10 space-y-8">

        {(listingsRes.error || profilesRes.error || bidsRes.error) && (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Some data could not be loaded. Apply{" "}
            <code className="text-ink">supabase/migrations/20240529_admin_moderation.sql</code>{" "}
            and add your user to <code className="text-ink">admin_users</code>.
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <AdminDashboardSection
            title="Recent listings"
            description="Latest listings across the marketplace."
          >
            {listings.length === 0 ? (
              <p className={sectionMuted}>No listings yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {listings.map((listing) => (
                  <li key={listing.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/auctions/${listing.id}`}
                          className="font-medium text-ink hover:text-accent"
                        >
                          {listing.title}
                        </Link>
                        <p className="mt-1 text-xs text-muted">
                          {formatWhen(listing.created_at)} · {formatPrice(listing.current_price)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(listing.status, listing.is_hidden)}`}
                      >
                        {listing.is_hidden ? "hidden" : listing.status}
                      </span>
                    </div>
                    <AdminListingActions
                      listingId={listing.id}
                      status={listing.status}
                      isHidden={listing.is_hidden}
                    />
                  </li>
                ))}
              </ul>
            )}
          </AdminDashboardSection>

          <AdminDashboardSection
            title="Recent profiles"
            description="Newest seller and bidder accounts."
          >
            {profiles.length === 0 ? (
              <p className={sectionMuted}>No profiles yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {profiles.map((profile) => (
                  <li key={profile.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div>
                      <Link
                        href={`/seller/${profile.id}`}
                        className="font-medium text-ink hover:text-accent"
                      >
                        {getProfileDisplayName(profile, "Member")}
                      </Link>
                      <p className="text-xs text-muted">{formatWhen(profile.created_at)}</p>
                    </div>
                    <Link
                      href={`/seller/${profile.id}`}
                      className="text-xs text-muted hover:text-accent"
                    >
                      Seller page
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminDashboardSection>
        </div>

        <AdminDashboardSection
          title="Reported listings"
          description={
            pendingReportCount > 0
              ? `${pendingReportCount} pending report${pendingReportCount === 1 ? "" : "s"} need review.`
              : "User-submitted reports awaiting moderation."
          }
        >
          {reports.length === 0 ? (
            <p className={sectionMuted}>No reports yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {reports.map((report) => {
                const listing = report.listings;
                return (
                  <li
                    key={report.id}
                    className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:py-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {listing ? (
                          <Link
                            href={`/auctions/${listing.id}`}
                            className="font-medium text-ink hover:text-accent"
                          >
                            {listing.title}
                          </Link>
                        ) : (
                          <p className="font-medium text-ink">Listing unavailable</p>
                        )}
                        <p className="mt-1 text-xs text-muted">
                          {formatWhen(report.created_at)} ·{" "}
                          {getListingReportReasonLabel(report.reason)}
                        </p>
                        {report.message ? (
                          <p className="mt-2 text-sm leading-relaxed text-ink/90">
                            {report.message}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${reportStatusBadgeClass(report.status)}`}
                      >
                        {report.status}
                      </span>
                    </div>
                    {listing ? (
                      <AdminListingActions
                        listingId={listing.id}
                        status={listing.status}
                        isHidden={listing.is_hidden}
                      />
                    ) : null}
                    <AdminReportActions reportId={report.id} status={report.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </AdminDashboardSection>

        <div className="grid gap-6 lg:grid-cols-2">
          <AdminDashboardSection title="Recent bids" description="Latest bid activity.">
            {bids.length === 0 ? (
              <p className={sectionMuted}>No bids yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {bids.map((bid) => (
                  <li key={bid.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="font-medium text-ink">{formatPrice(bid.amount)}</p>
                    <p className="text-xs text-muted">
                      {formatWhen(bid.created_at)} · listing{" "}
                      <Link
                        href={`/auctions/${bid.listing_id}`}
                        className="text-ink hover:text-accent"
                      >
                        {listingTitleById.get(bid.listing_id) ?? bid.listing_id.slice(0, 8)}
                      </Link>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </AdminDashboardSection>
        </div>
      </div>
    </AuthenticatedSection>
  );
}
