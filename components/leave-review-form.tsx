"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { StarRating } from "@/components/star-rating";
import { StarRatingPicker } from "@/components/star-rating-picker";
import { createClient } from "@/lib/supabase/client";

type LeaveReviewFormProps = {
  listingId: string;
  sellerId: string;
  reviewerId: string;
};

export function LeaveReviewForm({ listingId, sellerId, reviewerId }: LeaveReviewFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmed = comment.trim();
    if (trimmed.length > 2000) {
      setErrorMessage("Comment must be 2000 characters or less.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("reviews").insert({
      listing_id: listingId,
      reviewer_id: reviewerId,
      seller_id: sellerId,
      rating,
      comment: trimmed,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setSuccessMessage("Thank you — your review was submitted.");
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="mb-3 text-sm font-medium text-ink/90">Your rating</p>
        <StarRatingPicker rating={rating} onChange={setRating} disabled={loading} />
        <div className="mt-2">
          <StarRating rating={rating} size="sm" />
        </div>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ink/90">
          Comment <span className="font-normal text-muted">(optional)</span>
        </span>
        <textarea
          rows={4}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          disabled={loading}
          maxLength={2000}
          placeholder="Share your experience with this seller…"
          className="w-full rounded-2xl border border-border bg-page-dark px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-accent disabled:opacity-60"
        />
        <span className="mt-1 block text-right text-xs text-muted">{comment.length}/2000</span>
      </label>

      {errorMessage ? (
        <p className="rounded-2xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
          {successMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || Boolean(successMessage)}
        className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-black transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
