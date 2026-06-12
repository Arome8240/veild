"use client";

import { useAccount } from "wagmi";
import { BottomNav } from "@/components/bottom-nav";
import { PoolCard } from "@/components/PoolCard";
import { usePoolCount, useVeildPools } from "@/hooks/usePools";

export default function PoolsPage() {
  const { address }           = useAccount();
  const { data: countRaw }    = usePoolCount();
  const count                 = Number((countRaw as bigint | undefined) ?? 0n);
  const { contribute }        = useVeildPools();

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur px-4 py-3">
        <h1 className="text-lg font-bold">Pools</h1>
        <p className="text-xs text-zinc-500">Community Q&amp;A funding pools</p>
      </header>

      <div className="px-4 py-4 space-y-3">
        {count === 0 ? (
          <p className="text-center text-sm text-zinc-500 py-8">No pools yet.</p>
        ) : (
          Array.from({ length: count }, (_, i) => BigInt(i + 1)).reverse().map((id) => (
            <PoolCard
              key={id.toString()}
              poolId={id}
              onContribute={(poolId) => contribute(poolId, 10000000000000000n)}
            />
          ))
        )}
      </div>

      <BottomNav />
    </main>
  );
}
