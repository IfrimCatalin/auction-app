import { cn } from "@/lib/cn";

type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
};

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-[3px]",
};

export function LoadingSpinner({ size = "md", className, label = "Loading" }: LoadingSpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full border-accent/30 border-t-accent motion-reduce:animate-none",
        sizeMap[size],
        className
      )}
    />
  );
}

export function LoadingCenter({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[12rem] items-center justify-center py-12">
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}
