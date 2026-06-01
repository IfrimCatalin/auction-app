import { forwardRef } from "react";
import { inputBase } from "@/lib/ui-tokens";
import { cn } from "@/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, hasError, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        inputBase,
        hasError && "border-red-500/50 focus-visible:ring-red-500/40",
        className
      )}
      {...props}
    />
  );
});
