"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type OrdersPageTabsProps = {
  purchaseCount: number;
  salesCount: number;
};

export function OrdersPageTabs({ purchaseCount, salesCount }: OrdersPageTabsProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "sales" ? "sales" : "purchases";

  const tabClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      active
        ? "bg-accent text-black"
        : "border border-border bg-surface text-ink hover:border-accent/40"
    }`;

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <Link href="/orders" className={tabClass(tab === "purchases")}>
        Purchases ({purchaseCount})
      </Link>
      <Link href="/orders?tab=sales" className={tabClass(tab === "sales")}>
        Sales ({salesCount})
      </Link>
    </div>
  );
}
