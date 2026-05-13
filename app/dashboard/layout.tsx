import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your GoBidMe dashboard—overview of bids, watchlist, and account activity.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
