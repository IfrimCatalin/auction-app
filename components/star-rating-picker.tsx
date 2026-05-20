"use client";

type StarRatingPickerProps = {
  rating: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  size?: "md" | "lg";
};

function sizeClass(size: "md" | "lg") {
  return size === "lg" ? "text-2xl" : "text-xl";
}

export function StarRatingPicker({
  rating,
  onChange,
  disabled = false,
  size = "lg",
}: StarRatingPickerProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div
      className={`inline-flex items-center gap-1 ${sizeClass(size)}`}
      role="radiogroup"
      aria-label="Rating"
    >
      {stars.map((value) => (
        <button
          key={value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(value)}
          className={`transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 ${
            value <= rating ? "text-accent" : "text-border hover:text-accent/60"
          }`}
          aria-label={`${value} star${value === 1 ? "" : "s"}`}
          aria-pressed={rating === value}
        >
          ★
        </button>
      ))}
    </div>
  );
}
