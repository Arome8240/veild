"use client";

import { useCallback } from "react";
import { useAccount } from "wagmi";
import { BottomNav } from "@/components/bottom-nav";
import { AuctionCard } from "@/components/AuctionCard";
import { useAuctionCount, useVeildAuction } from "@/hooks/useAuction";

export default function AuctionsPage() {
  const { address }             = useAccount();
  const { data: countRaw }      = useAuctionCount();
  const count                   = Number(countRaw ?? 0n);
  const { placeBid, claimWin }  = useVeildAuction();

  const handleBid  = useCallback((aId: bigint, amt: bigint) => placeBid(aId, amt), [placeBid]);
  const handleClaim = useCallback((aId: bigint) => claimWin(aId), [claimWin]);

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur px-4 py-3">
        <h1 className="text-lg font-bold">Auctions</h1>
        <p className="text-xs text-zinc-500">Live CELO slot auctions</p>
      </header>

      <div className="px-4 py-4 space-y-3">
        {count === 0 ? (
          <p className="text-center text-sm text-zinc-500 py-8">No auctions yet.</p>
        ) : (
          Array.from({ length: count }, (_, i) => BigInt(i + 1)).reverse().map((id) => (
            <AuctionCard
              key={id.toString()}
              auctionId={id}
              viewer={address}
              onBid={handleBid}
              onClaim={handleClaim}
            />
          ))
        )}
      </div>

      <BottomNav />
    </main>
  );
}
