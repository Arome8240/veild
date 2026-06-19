"use client";

import { type Address } from "viem";
import { useTipEarnings, useTipCount, useTotalTipped } from "./useTips";
import { useSubEarnings, useSubscriberCount }          from "./useSubscriptions";
import { useGiftEarnings }                             from "./useGifts";
import { useBoostScore }                               from "./useStaking";

export interface CreatorAnalytics {
  tipEarnings:     bigint;
  subEarnings:     bigint;
  giftEarnings:    bigint;
  totalEarnings:   bigint;
  tipCount:        bigint;
  totalTipped:     bigint;
  subscriberCount: bigint;
  boostScore:      bigint;
}

/**
 * Aggregates all on-chain earnings and engagement metrics for a creator
 * into a single convenient object. Each underlying hook fetches independently
 * so stale values update as each settles.
 */
export function useCreatorAnalytics(creator: Address | undefined): {
  data: CreatorAnalytics;
  isLoading: boolean;
} {
  const tips          = useTipEarnings(creator);
  const subs          = useSubEarnings(creator);
  const gifts         = useGiftEarnings(creator);
  const tipCount      = useTipCount(creator);
  const totalTipped   = useTotalTipped(creator);
  const subCount      = useSubscriberCount(creator);
  const boost         = useBoostScore(creator);

  const isLoading =
    tips.isLoading || subs.isLoading || gifts.isLoading ||
    tipCount.isLoading || totalTipped.isLoading || subCount.isLoading || boost.isLoading;

  return {
    data: {
      tipEarnings:     tips.data,
      subEarnings:     subs.data,
      giftEarnings:    gifts.data,
      totalEarnings:   tips.data + subs.data + gifts.data,
      tipCount:        tipCount.data,
      totalTipped:     totalTipped.data,
      subscriberCount: subCount.data,
      boostScore:      boost.data,
    },
    isLoading,
  };
}
