"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { BottomNav } from "@/components/bottom-nav";
import { GiftPicker } from "@/components/GiftPicker";
import { useCreatorByUsername } from "@/hooks/useCreatorProfile";
import { useVeildGifts } from "@/hooks/useGifts";
import type { Address } from "viem";

export default function GiftsPage() {
  const { username }      = useParams<{ username: string }>();
  const { address }       = useAccount();
  const { data: creator } = useCreatorByUsername(username);
  const { sendGift }      = useVeildGifts();

  const handleGift = useCallback((giftTypeId: number, price: bigint, message: string) => {
    if (!address) return;
    sendGift(address, BigInt(giftTypeId), message, price);
  }, [address, sendGift]);

  if (!creator) {
    return (
      <main className="min-h-screen pb-24">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur px-4 py-3">
          <h1 className="text-lg font-bold">Gifts</h1>
        </header>
        <div className="flex items-center justify-center h-40" role="status" aria-live="polite">
          <p className="text-sm text-zinc-500">Loading…</p>
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur px-4 py-3">
        <h1 className="text-lg font-bold">Gift @{creator.username}</h1>
        <p className="text-xs text-zinc-500">Send a virtual gift on-chain</p>
      </header>

      <div className="px-4 py-4">
        <GiftPicker
          recipient={address ?? ("0x0" as Address)}
          onGift={handleGift}
        />
      </div>

      <BottomNav />
    </main>
  );
}
