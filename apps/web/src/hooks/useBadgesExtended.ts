"use client";

import { useCallback } from "react";
import { useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { useCeloWrite } from "./useCeloWrite";
import { type Address } from "viem";
import { veildBadges, BADGE_IDS } from "@/lib/contracts";
import type { BadgeBitmap } from "@/lib/contracts";

export function useAwardBadge() {
  const { writeContract, data: txHash, isPending, error, reset } = useCeloWrite();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const awardBadge = useCallback((to: Address, badgeId: number) => {
    writeContract({
      ...veildBadges.celo,
      functionName: "awardBadge",
      args: [to, BigInt(badgeId)],
    });
  }, [writeContract]);

  return { awardBadge, isPending, isConfirming, isConfirmed, error, reset };
}

export function useCreatorBadges(address: Address | undefined) {
  const result = useReadContract({
    ...veildBadges.celo,
    functionName: "getBadges",
    args:         address ? [address] : undefined,
    query:        { enabled: !!address },
  });
  return { ...result, data: result.data as BadgeBitmap | undefined };
}

export function useHasBadge(address: Address | undefined, badgeId: number) {
  const result = useReadContract({
    ...veildBadges.celo,
    functionName: "hasBadge",
    args:         address ? [address, BigInt(badgeId)] : undefined,
    query:        { enabled: !!address },
  });
  return { ...result, data: result.data as boolean | undefined };
}

export { BADGE_IDS };
