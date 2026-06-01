"use client";

import { forwardRef } from "react";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "@/lib/button-variants";
import { cn } from "@/lib/cn";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    disabled,
    className,
    children,
    type = "button",
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        buttonClasses(variant, size),
        fullWidth && "w-full",
        loading && "relative",
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <span className="opacity-0">{children}</span>
          <span className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner size="sm" />
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
});
