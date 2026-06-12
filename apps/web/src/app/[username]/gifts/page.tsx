"use client";

import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { BottomNav } from "@/components/bottom-nav";
import { GiftPicker } from "@/components/GiftPicker";
import { useCreatorByUsername } from "@/hooks/useCreatorProfile";
import { useVeildGifts } from "@/hooks/useGifts";
import { useReadContract } from "wagmi";
import { veildRegistry } from "@/lib/contracts";
import type { Address } from "viem";

export default function GiftsPage() {
  const { username }    = useParams<{ username: string }>();
  const { address }     = useAccount();
  const { data: creator } = useCreatorByUsername(username);

  const addrResult = useReadContract({
    ...veildRegistry.celo,
    functionName: "getCreatorByUsername",
    args: username ? [username] : undefined,
    query: { enabled: !!username },
  });

  const { sendGift } = useVeildGifts();
  const creatorAddress = address;

  if (!creator) {
    return (
      <main className="min-h-screen pb-24">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur px-4 py-3">
          <h1 className="text-lg font-bold">Gifts</h1>
        </header>
        <div className="flex items-center justify-center h-40">
          <p className="text-sm text-zinc-500">Loading…</p>
        </div>
        <BottomNav />
      </main>
    );
  }

  const handleGift = (giftTypeId: number, price: bigint, message: string) => {
    if (!creatorAddress) return;
    sendGift(creatorAddress, BigInt(giftTypeId), message, price);
  };

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur px-4 py-3">
        <h1 className="text-lg font-bold">Gift @{creator.username}</h1>
        <p className="text-xs text-zinc-500">Send a virtual gift on-chain</p>
      </header>

      <div className="px-4 py-4">
        <GiftPicker
          recipient={creatorAddress ?? ("0x0" as Address)}
          onGift={handleGift}
        />
      </div>

      <BottomNav />
    </main>
  );
}
