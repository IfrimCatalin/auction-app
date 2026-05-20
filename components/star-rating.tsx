type StarRatingProps = {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
};

function sizeClass(size: "sm" | "md" | "lg") {
  switch (size) {
    case "lg":
      return "text-xl";
    case "md":
      return "text-base";
    default:
      return "text-sm";
  }
}

export function StarRating({
  rating,
  max = 5,
  size = "md",
  showValue = false,
  className = "",
}: StarRatingProps) {
  const clamped = Math.max(0, Math.min(max, rating));
  const stars = Array.from({ length: max }, (_, index) => index + 1);

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div
        className={`inline-flex items-center gap-0.5 ${sizeClass(size)}`}
        aria-label={`${clamped} out of ${max} stars`}
      >
        {stars.map((star) => (
          <span
            key={star}
            className={star <= clamped ? "text-accent" : "text-border"}
            aria-hidden
          >
            ★
          </span>
        ))}
      </div>
      {showValue ? (
        <span className="text-sm font-medium tabular-nums text-ink">{clamped.toFixed(1)}</span>
      ) : null}
    </div>
  );
}
