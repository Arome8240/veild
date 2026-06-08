"use client";

import { useReadContract } from "wagmi";
import { type Address } from "viem";
import { veildBadges } from "@/lib/contracts";

export function useHasBadge(holder: Address | undefined, badgeId: bigint) {
  return useReadContract({
    ...veildBadges.celo,
    functionName: "hasBadge",
    args: holder ? [holder, badgeId] : undefined,
    query: { enabled: !!holder },
  });
}

export function useHolderBadges(holder: Address | undefined) {
  return useReadContract({
    ...veildBadges.celo,
    functionName: "getBadges",
    args: holder ? [holder] : undefined,
    query: { enabled: !!holder },
  });
}

export function useBadgeCount(holder: Address | undefined) {
  return useReadContract({
    ...veildBadges.celo,
    functionName: "badgeCount",
    args: holder ? [holder] : undefined,
    query: { enabled: !!holder },
  });
}

export function useBadgeBitmap(holder: Address | undefined) {
  return useReadContract({
    ...veildBadges.celo,
    functionName: "getBadgeBitmap",
    args: holder ? [holder] : undefined,
    query: { enabled: !!holder },
  });
}
