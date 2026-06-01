import { forwardRef } from "react";
import { inputBase } from "@/lib/ui-tokens";
import { cn } from "@/lib/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, hasError, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        inputBase,
        "min-h-[120px] resize-y",
        hasError && "border-red-500/50 focus-visible:ring-red-500/40",
        className
      )}
      {...props}
    />
  );
});
