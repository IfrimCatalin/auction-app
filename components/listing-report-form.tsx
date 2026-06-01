"use client";

import { FormEvent, useState, useTransition } from "react";
import { submitListingReportAction } from "@/app/listing-reports/actions";
import {
  LISTING_REPORT_REASONS,
  type ListingReportReason,
} from "@/lib/listing-reports";
import { btnPrimary, btnSecondary, inputBase } from "@/lib/ui-theme";

type ListingReportFormProps = {
  listingId: string;
  onClose: () => void;
  onSubmitted: () => void;
};

export function ListingReportForm({
  listingId,
  onClose,
  onSubmitted,
}: ListingReportFormProps) {
  const [reason, setReason] = useState<ListingReportReason>("scam");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await submitListingReportAction({
        listingId,
        reason,
        message,
      });

      if (!result.ok) {
        setError(result.error ?? "Could not submit report.");
        return;
      }

      setSuccess(true);
      window.setTimeout(() => {
        onSubmitted();
      }, 900);
    });
  }

  if (success) {
    return (
      <div className="space-y-4">
        <p className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Thank you. Your report was submitted. Our moderation team will review it.
        </p>
        <button type="button" onClick={onClose} className={`${btnSecondary} w-full`}>
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="report-reason" className="mb-2 block text-sm font-medium text-ink">
          Reason
        </label>
        <select
          id="report-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value as ListingReportReason)}
          className={inputBase}
          required
          disabled={pending}
        >
          {LISTING_REPORT_REASONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="report-message" className="mb-2 block text-sm font-medium text-ink">
          Details <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="report-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          maxLength={1000}
          disabled={pending}
          placeholder="Add context for our moderation team…"
          className={`${inputBase} min-h-[6rem] resize-y`}
        />
        <p className="mt-1 text-right text-xs text-muted">{message.length}/1000</p>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
        <button type="submit" disabled={pending} className={`${btnPrimary} w-full sm:w-auto`}>
          {pending ? "Submitting…" : "Submit report"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className={`${btnSecondary} w-full sm:w-auto`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
