"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buttonClasses } from "@/lib/button-variants";
import { cn } from "@/lib/cn";

type OrdersPageTabsProps = {
  purchaseCount: number;
  salesCount: number;
};

export function OrdersPageTabs({ purchaseCount, salesCount }: OrdersPageTabsProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "sales" ? "sales" : "purchases";

  const tabClass = (active: boolean) =>
    cn(
      buttonClasses(active ? "primary" : "secondary", "md"),
      !active && "bg-surface"
    );

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link href="/orders" className={tabClass(tab === "purchases")}>
        Purchases ({purchaseCount})
      </Link>
      <Link href="/orders?tab=sales" className={tabClass(tab === "sales")}>
        Sales ({salesCount})
      </Link>
    </div>
  );
}
