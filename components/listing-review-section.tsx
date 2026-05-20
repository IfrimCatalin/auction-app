import { LeaveReviewForm } from "@/components/leave-review-form";
import { StarRating } from "@/components/star-rating";
import type { Review } from "@/lib/reviews";
import { formatReviewDate } from "@/lib/reviews";

type ListingReviewSectionProps = {
  canLeaveReview: boolean;
  existingReview: Review | null;
  listingId: string;
  sellerId: string;
  reviewerId: string;
};

export function ListingReviewSection({
  canLeaveReview,
  existingReview,
  listingId,
  sellerId,
  reviewerId,
}: ListingReviewSectionProps) {
  if (!canLeaveReview && !existingReview) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-border pt-6">
      <h2 className="text-sm font-semibold tracking-tight text-ink">
        {existingReview ? "Your review" : "Leave a review"}
      </h2>

      {existingReview ? (
        <div className="mt-4 rounded-2xl border border-accent/25 bg-accent/5 px-4 py-4 sm:px-5 sm:py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            Submitted
          </p>
          <div className="mt-2">
            <StarRating rating={existingReview.rating} size="md" />
          </div>
          {existingReview.comment.trim() ? (
            <p className="mt-3 text-sm leading-relaxed text-ink/90">{existingReview.comment}</p>
          ) : (
            <p className="mt-3 text-sm text-muted">No written comment.</p>
          )}
          <p className="mt-2 text-xs text-muted">
            Submitted {formatReviewDate(existingReview.created_at)}
          </p>
        </div>
      ) : canLeaveReview ? (
        <div className="mt-4 rounded-2xl border border-border bg-page p-4 sm:p-5">
          <p className="mb-4 text-sm leading-relaxed text-muted">
            You won this auction. Rate your experience with the seller — your feedback helps
            other buyers on GoBidMe.
          </p>
          <LeaveReviewForm
            listingId={listingId}
            sellerId={sellerId}
            reviewerId={reviewerId}
          />
        </div>
      ) : null}
    </div>
  );
}
