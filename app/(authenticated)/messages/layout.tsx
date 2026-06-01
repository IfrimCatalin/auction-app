import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages",
  description: "Chat with buyers and sellers on GoBidMe.",
};

export const dynamic = "force-dynamic";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
