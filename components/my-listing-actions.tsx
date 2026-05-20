"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { removeStorageImagesByUrls } from "@/lib/storage-images";

type MyListingActionsProps = {
  listingId: string;
  listingTitle: string;
  imageUrls: string[];
  redirectAfterDelete?: string;
};

export function MyListingActions({
  listingId,
  listingTitle,
  imageUrls,
  redirectAfterDelete = "/my-listings",
}: MyListingActionsProps) {
  const router = useRouter();
  const supabase = createClient();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setErrorMessage("");

    const { error } = await supabase.from("listings").delete().eq("id", listingId);

    if (error) {
      setErrorMessage(error.message);
      setDeleting(false);
      return;
    }

    try {
      await removeStorageImagesByUrls(supabase, imageUrls);
    } catch {
      // Best-effort storage cleanup; listing is already removed.
    }

    setShowDeleteModal(false);
    router.push(redirectAfterDelete);
    router.refresh();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/auctions/${listingId}`}
          className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-page-dark sm:text-sm"
        >
          View
        </Link>
        <Link
          href={`/edit-listing/${listingId}`}
          className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-page-dark sm:text-sm"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={() => {
            setErrorMessage("");
            setShowDeleteModal(true);
          }}
          className="rounded-full border border-rose-500/40 bg-rose-950/30 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-950/50 sm:text-sm"
        >
          Delete
        </button>
      </div>

      {showDeleteModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-my-listing-title"
        >
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-xl">
            <h3 id="delete-my-listing-title" className="text-lg font-semibold text-ink">
              Delete this listing?
            </h3>
            <p className="mt-2 text-sm text-muted">
              <span className="font-medium text-ink">{listingTitle}</span> will be
              permanently removed, including all photos. This cannot be undone.
            </p>

            {errorMessage ? (
              <p className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-page-dark disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-medium text-black transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
