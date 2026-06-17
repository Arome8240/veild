"use client";

import { useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { useCeloWrite } from "./useCeloWrite";
import { type Address } from "viem";
import { veildReferral, type ReferrerStats } from "@/lib/contracts";

export function useVeildReferral() {
  const { writeContract, data: txHash, isPending, error, reset } = useCeloWrite();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  function claimReward() {
    writeContract({
      ...veildReferral.celo,
      functionName: "claimReward",
      args: [],
    });
  }

  return {
    txHash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    reset,
    claimReward,
  };
}

export function useReferrerStats(referrer: Address | undefined) {
  const result = useReadContract({
    ...veildReferral.celo,
    functionName: "getStats",
    args: referrer ? [referrer] : undefined,
    query: { enabled: !!referrer },
  });
  return { ...result, data: result.data as ReferrerStats | undefined };
}

export function useReferrer(referred: Address | undefined) {
  const result = useReadContract({
    ...veildReferral.celo,
    functionName: "getReferrer",
    args: referred ? [referred] : undefined,
    query: { enabled: !!referred },
  });
  return { ...result, data: result.data as Address | undefined };
}

export function useTotalReferrals() {
  const result = useReadContract({
    ...veildReferral.celo,
    functionName: "totalReferrals",
    args: [],
  });
  return { ...result, data: (result.data as bigint | undefined) ?? 0n };
}
