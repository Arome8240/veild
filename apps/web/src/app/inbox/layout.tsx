import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inbox — Veild",
  description: "Read and reply to your anonymous messages.",
  robots: { index: false },
};

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
