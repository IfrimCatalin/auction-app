"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ListingReportForm } from "@/components/listing-report-form";
import { btnSecondary } from "@/lib/ui-theme";

type ListingReportButtonProps = {
  listingId: string;
  isAuthenticated: boolean;
  isOwner: boolean;
  hasExistingReport: boolean;
  variant?: "default" | "inline";
};

export function ListingReportButton({
  listingId,
  isAuthenticated,
  isOwner,
  hasExistingReport,
  variant = "default",
}: ListingReportButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(hasExistingReport);

  useEffect(() => {
    setSubmitted(hasExistingReport);
  }, [hasExistingReport]);

  const closeModal = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeModal]);

  if (isOwner) {
    return null;
  }

  function openReport() {
    if (!isAuthenticated) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.push(`/login${next}`);
      return;
    }
    if (submitted) {
      return;
    }
    setOpen(true);
  }

  const buttonClass =
    variant === "inline"
      ? "inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-accent"
      : `${btnSecondary} w-full text-sm disabled:cursor-not-allowed disabled:opacity-60`;

  return (
    <>
      <div className={variant === "default" ? "space-y-2" : undefined}>
        <button
          type="button"
          onClick={openReport}
          disabled={submitted}
          className={buttonClass}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          {variant === "inline" ? (
            <>
              <FlagIcon />
              {submitted ? "Report submitted" : "Report listing"}
            </>
          ) : submitted ? (
            "Report submitted"
          ) : (
            "Report listing"
          )}
        </button>

        {submitted && variant === "default" ? (
          <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-xs text-emerald-100">
            Thanks — we received your report and will review it.
          </p>
        ) : null}

        {!isAuthenticated && variant === "default" ? (
          <p className="text-center text-xs text-muted">
            <Link href="/login" className="text-ink hover:text-accent">
              Sign in
            </Link>{" "}
            to report this listing.
          </p>
        ) : null}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4"
          role="presentation"
          onClick={closeModal}
        >
          <div
            className="max-h-[min(92vh,640px)] w-full overflow-y-auto rounded-t-3xl border border-border bg-surface p-5 shadow-2xl shadow-black/60 sm:max-w-md sm:rounded-3xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-listing-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  Safety
                </p>
                <h2 id="report-listing-title" className="mt-1 text-lg font-semibold text-ink">
                  Report this listing
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Choose a reason and add details if helpful. One report per listing.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="shrink-0 rounded-full border border-border px-2.5 py-1 text-sm text-muted hover:text-ink"
                aria-label="Close report dialog"
              >
                ✕
              </button>
            </div>

            <ListingReportForm
              listingId={listingId}
              onClose={closeModal}
              onSubmitted={() => {
                setSubmitted(true);
                setOpen(false);
                router.refresh();
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function FlagIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M4 21V4M4 4h12l-2 3 2 3H4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
