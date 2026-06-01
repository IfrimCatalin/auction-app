import { forwardRef } from "react";
import { inputBase } from "@/lib/ui-tokens";
import { cn } from "@/lib/cn";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, hasError, children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={cn(
        inputBase,
        "cursor-pointer appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10",
        hasError && "border-red-500/50 focus-visible:ring-red-500/40",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
