import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buttonClasses } from "@/lib/button-variants";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  icon?: React.ReactNode;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
  icon,
}: EmptyStateProps) {
  return (
    <Card padding="lg" className={cn("text-center", className)}>
      {icon ? <div className="mx-auto mb-4 text-accent">{icon}</div> : null}
      <p className="text-base font-semibold text-ink">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{description}</p> : null}
      {actionLabel && actionHref ? (
        <Link href={actionHref} className={`${buttonClasses("primary", "md")} mt-6 inline-flex`}>
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && onAction ? (
        <Button type="button" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Card>
  );
}
