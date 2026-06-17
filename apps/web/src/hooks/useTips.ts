"use client";

import { useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { useCeloWrite } from "./useCeloWrite";
import { type Address } from "viem";
import { veildTips, type Tip, type FanEntry } from "@/lib/contracts";

/**
 * useVeildTips — write actions for VeildTips (tip, claimEarnings).
 *
 * Uses the same contract-spread pattern as useVeildContracts so each call
 * is a single veildTips.celo spread with a functionName override.
 */
export function useVeildTips() {
  const { writeContract, data: txHash, isPending, error, reset } = useCeloWrite();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  function sendTip(creatorAddress: Address, message: string, amount: bigint) {
    writeContract({
      ...veildTips.celo,
      functionName: "tip",
      args: [creatorAddress, message],
      value: amount,
    });
  }

  function claimTipEarnings() {
    writeContract({
      ...veildTips.celo,
      functionName: "claimEarnings",
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
    sendTip,
    claimTipEarnings,
  };
}

// ─── Read hooks ───────────────────────────────────────────────────────────────

export function useTipEarnings(creatorAddress: Address | undefined) {
  const result = useReadContract({
    ...veildTips.celo,
    functionName: "getEarnings",
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress },
  });
  return { ...result, data: (result.data as bigint | undefined) ?? 0n };
}

export function useTips(creatorAddress: Address | undefined) {
  const result = useReadContract({
    ...veildTips.celo,
    functionName: "getTips",
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress },
  });
  return { ...result, data: (result.data as Tip[] | undefined) ?? [] };
}

export function useTipCount(creatorAddress: Address | undefined) {
  const result = useReadContract({
    ...veildTips.celo,
    functionName: "getTipCount",
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress },
  });
  return { ...result, data: (result.data as bigint | undefined) ?? 0n };
}

export function useTipLeaderboard(creatorAddress: Address | undefined) {
  const result = useReadContract({
    ...veildTips.celo,
    functionName: "getLeaderboard",
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress },
  });
  return { ...result, data: (result.data as FanEntry[] | undefined) ?? [] };
}

export function useTotalTipped(creatorAddress: Address | undefined) {
  const result = useReadContract({
    ...veildTips.celo,
    functionName: "getTotalTipped",
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress },
  });
  return { ...result, data: (result.data as bigint | undefined) ?? 0n };
}
