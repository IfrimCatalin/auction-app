"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminSetListingReportStatusAction } from "@/app/admin/actions";
import type { ListingReportStatus } from "@/lib/listing-reports";

type AdminReportActionsProps = {
  reportId: string;
  status: ListingReportStatus;
};

export function AdminReportActions({ reportId, status }: AdminReportActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function runAction(nextStatus: "reviewed" | "resolved") {
    setFeedback(null);
    startTransition(async () => {
      const result = await adminSetListingReportStatusAction(reportId, nextStatus);
      if (!result.ok) {
        setFeedback({ type: "error", text: result.error ?? "Update failed." });
        return;
      }
      setFeedback({
        type: "success",
        text: nextStatus === "reviewed" ? "Marked as reviewed." : "Marked as resolved.",
      });
      router.refresh();
    });
  }

  if (status === "resolved") {
    return <span className="text-xs text-muted">Resolved</span>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {status === "pending" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => runAction("reviewed")}
            className="rounded-full border border-border bg-page-dark px-3 py-1.5 text-xs font-medium text-ink transition hover:border-accent/40 disabled:opacity-50"
          >
            Mark reviewed
          </button>
        ) : null}
        <button
          type="button"
          disabled={pending}
          onClick={() => runAction("resolved")}
          className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/20 disabled:opacity-50"
        >
          Mark resolved
        </button>
      </div>
      {feedback ? (
        <p
          role="status"
          className={`text-xs ${
            feedback.type === "success" ? "text-emerald-200" : "text-red-200"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}
