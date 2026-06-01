import type { ReactNode } from "react";
import { card } from "@/lib/ui-theme";

type AdminDashboardSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AdminDashboardSection({
  title,
  description,
  children,
}: AdminDashboardSectionProps) {
  return (
    <section className={`${card} p-5 sm:p-6`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
