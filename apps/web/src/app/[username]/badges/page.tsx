"use client";

import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { BottomNav } from "@/components/bottom-nav";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { useCreatorByUsername } from "@/hooks/useCreatorProfile";
import { useReadContract } from "wagmi";
import { veildRegistry } from "@/lib/contracts";
import type { Address } from "viem";

export default function BadgesPage() {
  const { username }      = useParams<{ username: string }>();
  const { address }       = useAccount();
  const { data: creator } = useCreatorByUsername(username);

  const addrResult = useReadContract({
    ...veildRegistry.celo,
    functionName: "getCreatorByUsername",
    args:         username ? [username] : undefined,
    query:        { enabled: !!username },
  });

  const creatorAddress = (address ?? "0x0") as Address;

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur px-4 py-3">
        <h1 className="text-lg font-bold">Badges</h1>
        <p className="text-xs text-zinc-500">@{username} achievements</p>
      </header>

      <div className="px-4 py-4 space-y-4">
        <p className="text-sm text-zinc-400">
          Soulbound badges are awarded automatically by the protocol for on-chain
          milestones — they cannot be transferred or sold.
        </p>

        <BadgeDisplay creator={creatorAddress} />
      </div>

      <BottomNav />
    </main>
  );
}
