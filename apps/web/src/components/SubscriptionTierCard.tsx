"use client";

import { formatEther, type Address } from "viem";
import { useCreatorTiers, useIsSubscribed } from "@/hooks/useSubscription";
import type { SubscriptionTier } from "@/lib/contracts";

interface Props {
  creator:   Address;
  subscriber?: Address;
  onSubscribe?: (tierId: bigint, price: bigint) => void;
}

export function SubscriptionTierCard({ creator, subscriber, onSubscribe }: Props) {
  const { data: tiers } = useCreatorTiers(creator);
  const { data: isSub } = useIsSubscribed(creator, subscriber);

  if (!tiers || tiers.length === 0) return null;

  const activeTiers = tiers.filter((t: SubscriptionTier) => t.isActive);

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">Subscription Tiers</h3>
      <div className="space-y-2">
        {activeTiers.map((tier: SubscriptionTier, i: number) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
          >
            <div>
              <p className="font-medium text-sm">{tier.label}</p>
              <p className="text-xs text-zinc-500">{formatEther(tier.pricePerMonth)} CELO/month</p>
            </div>
            {!isSub && onSubscribe && (
              <button
                onClick={() => onSubscribe(BigInt(i), tier.pricePerMonth)}
                className="rounded-lg bg-purple-500/20 px-3 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-500/30 transition-colors"
              >
                Subscribe
              </button>
            )}
            {isSub && (
              <span className="text-xs text-green-400 font-medium">Subscribed</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
