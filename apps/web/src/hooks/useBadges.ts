"use client";

import { useReadContract } from "wagmi";
import { type Address } from "viem";
import { veildBadges } from "@/lib/contracts";

export function useHasBadge(holder: Address | undefined, badgeId: bigint) {
  const result = useReadContract({
    ...veildBadges.celo,
    functionName: "hasBadge",
    args: holder ? [holder, badgeId] : undefined,
    query: { enabled: !!holder },
  });
  return { ...result, data: (result.data as boolean | undefined) ?? false };
}

export function useHolderBadges(holder: Address | undefined) {
  const result = useReadContract({
    ...veildBadges.celo,
    functionName: "getBadges",
    args: holder ? [holder] : undefined,
    query: { enabled: !!holder },
  });
  return { ...result, data: (result.data as readonly bigint[] | undefined) ?? [] };
}

export function useBadgeCount(holder: Address | undefined) {
  const result = useReadContract({
    ...veildBadges.celo,
    functionName: "badgeCount",
    args: holder ? [holder] : undefined,
    query: { enabled: !!holder },
  });
  return { ...result, data: (result.data as bigint | undefined) ?? 0n };
}

export function useBadgeBitmap(holder: Address | undefined) {
  const result = useReadContract({
    ...veildBadges.celo,
    functionName: "getBadgeBitmap",
    args: holder ? [holder] : undefined,
    query: { enabled: !!holder },
  });
  return { ...result, data: result.data as readonly [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean] | undefined };
}
