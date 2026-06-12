"use client";

import { useReadContract } from "wagmi";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { veildRegistry } from "@/lib/contracts";

export default function LeaderboardPage() {
  const totalResult = useReadContract({
    ...veildRegistry.celo,
    functionName: "totalCreators",
    args: [],
  });
  const total = (totalResult.data as bigint | undefined) ?? 0n;

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur px-4 py-3">
        <h1 className="text-lg font-bold">Leaderboard</h1>
        <p className="text-xs text-zinc-500">{total.toString()} creators on Veild</p>
      </header>

      <div className="px-4 py-4 space-y-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-zinc-400">
          Full leaderboard pagination coming soon. Use{" "}
          <Link href="/discover" className="underline">Discover</Link>{" "}
          to search creators.
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
