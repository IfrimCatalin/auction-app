import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orders",
  description: "Auctions you have won on GoBidMe.",
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
