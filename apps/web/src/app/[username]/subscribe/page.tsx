"use client";

import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { BottomNav } from "@/components/bottom-nav";
import { SubscriptionTierCard } from "@/components/SubscriptionTierCard";
import { useCreatorByUsername } from "@/hooks/useCreatorProfile";
import { useVeildSubscriptions } from "@/hooks/useSubscription";

export default function SubscribePage() {
  const { username }      = useParams<{ username: string }>();
  const { address }       = useAccount();
  const { data: creator } = useCreatorByUsername(username);
  const { subscribe }     = useVeildSubscriptions();

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur px-4 py-3">
        <h1 className="text-lg font-bold">
          Subscribe{creator ? ` to @${creator.username}` : ""}
        </h1>
        <p className="text-xs text-zinc-500">Unlock exclusive on-chain access</p>
      </header>

      <div className="px-4 py-4">
        {address && creator ? (
          <SubscriptionTierCard
            creator={address}
            subscriber={address}
            onSubscribe={(tierId, price) => subscribe(address, tierId, price)}
          />
        ) : (
          <p className="text-center text-sm text-zinc-500 py-8">
            {!address ? "Connect your wallet to subscribe." : "Creator not found."}
          </p>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
