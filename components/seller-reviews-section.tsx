import Link from "next/link";
import { StarRating } from "@/components/star-rating";
import { formatReviewDate, type ReviewWithReviewer, type SellerRatingSummary } from "@/lib/reviews";

type SellerReviewsSectionProps = {
  summary: SellerRatingSummary;
  reviews: ReviewWithReviewer[];
};

export function SellerReviewsSection({ summary, reviews }: SellerReviewsSectionProps) {
  const hasReviews = summary.reviewCount > 0 && summary.averageRating != null;

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Seller reviews</h2>
        {hasReviews ? (
          <p className="text-sm text-muted">
            {summary.reviewCount} total review{summary.reviewCount === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>

      <div className="mt-4 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        {hasReviews ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Average rating
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <StarRating rating={summary.averageRating!} size="lg" showValue />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">No reviews yet for this seller.</p>
        )}
      </div>

      {reviews.length > 0 ? (
        <ul className="mt-4 space-y-3" aria-label="Recent reviews">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{review.reviewerLabel}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatReviewDate(review.created_at)}
                    {" · "}
                    <Link
                      href={`/auctions/${review.listing_id}`}
                      className="text-ink/80 underline-offset-2 hover:underline"
                    >
                      View listing
                    </Link>
                  </p>
                </div>
                <StarRating rating={review.rating} size="md" />
              </div>
              {review.comment.trim() ? (
                <p className="mt-3 text-sm leading-relaxed text-ink/90">{review.comment}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
