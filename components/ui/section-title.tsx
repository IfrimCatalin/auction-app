import { cn } from "@/lib/cn";
import { headingSection } from "@/lib/ui-tokens";

type SectionTitleProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function SectionTitle({ title, description, action, className }: SectionTitleProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 border-b border-border/80 pb-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div>
        <h2 className={headingSection}>{title}</h2>
        {description ? <p className="mt-2 text-sm text-muted sm:text-base">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
