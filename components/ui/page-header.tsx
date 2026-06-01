import { cn } from "@/lib/cn";
import { headingPage, sectionMuted } from "@/lib/ui-tokens";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 border-b border-accent/20 pb-8 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 border-l-4 border-accent pl-4 sm:pl-5">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">{eyebrow}</p>
        ) : null}
        <h1 className={cn(eyebrow ? "mt-2" : "", headingPage)}>{title}</h1>
        {description ? <p className={`${sectionMuted} mt-3 max-w-2xl`}>{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
