"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { removeStorageImagesByUrls } from "@/lib/storage-images";

type SellerListingActionsProps = {
  listingId: string;
  listingTitle: string;
  imageUrls: string[];
};

export function SellerListingActions({
  listingId,
  listingTitle,
  imageUrls,
}: SellerListingActionsProps) {
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
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2 border-t border-stone-200 pt-6">
        <Link
          href={`/edit-listing/${listingId}`}
          className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
        >
          Edit listing
        </Link>
        <button
          type="button"
          onClick={() => {
            setErrorMessage("");
            setShowDeleteModal(true);
          }}
          className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
        >
          Delete listing
        </button>
      </div>

      {showDeleteModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-listing-title"
        >
          <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-xl">
            <h3 id="delete-listing-title" className="text-lg font-semibold text-stone-900">
              Delete this listing?
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              <span className="font-medium text-stone-900">{listingTitle}</span> will be
              permanently removed, including all photos. This cannot be undone.
            </p>

            {errorMessage ? (
              <p className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-900 transition hover:bg-stone-100 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
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
