import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile — Veild",
  description: "Your Veild creator profile and stats.",
  robots: { index: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
