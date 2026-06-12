"use client";

import { useAccount } from "wagmi";
import { BottomNav } from "@/components/bottom-nav";
import { AnalyticsChart } from "@/components/AnalyticsChart";

export default function AnalyticsPage() {
  const { address } = useAccount();

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur px-4 py-3">
        <h1 className="text-lg font-bold">Analytics</h1>
        <p className="text-xs text-zinc-500">Your on-chain earnings and engagement</p>
      </header>

      <div className="px-4 py-4">
        {address ? (
          <AnalyticsChart creator={address} />
        ) : (
          <p className="text-center text-sm text-zinc-500 py-16">
            Connect your wallet to view analytics.
          </p>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
