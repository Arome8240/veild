"use client";

import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { type Address } from "viem";
import { veildPools } from "@/lib/contracts";

/**
 * useVeildPools — write and read hooks for VeildPools.
 *
 * Fan actions: createPool, contribute, claimRefund
 * Creator actions: answerPool
 * Public actions: markExpired
 */
export function useVeildPools() {
  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  function createPool(
    creatorAddress: Address,
    question: string,
    duration: bigint,
    amount: bigint
  ) {
    writeContract({
      ...veildPools.celo,
      functionName: "createPool",
      args: [creatorAddress, question, duration],
      value: amount,
    });
  }

  function contribute(poolId: bigint, amount: bigint) {
    writeContract({
      ...veildPools.celo,
      functionName: "contribute",
      args: [poolId],
      value: amount,
    });
  }

  function answerPool(poolId: bigint, answer: string) {
    writeContract({
      ...veildPools.celo,
      functionName: "answerPool",
      args: [poolId, answer],
    });
  }

  function markExpired(poolId: bigint) {
    writeContract({
      ...veildPools.celo,
      functionName: "markExpired",
      args: [poolId],
    });
  }

  function claimRefund(poolId: bigint, contribIndex: bigint) {
    writeContract({
      ...veildPools.celo,
      functionName: "claimRefund",
      args: [poolId, contribIndex],
    });
  }

  return {
    txHash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    reset,
    createPool,
    contribute,
    answerPool,
    markExpired,
    claimRefund,
  };
}

// ─── Read hooks ───────────────────────────────────────────────────────────────

export function usePool(poolId: bigint | undefined) {
  return useReadContract({
    ...veildPools.celo,
    functionName: "getPool",
    args: poolId !== undefined ? [poolId] : undefined,
    query: { enabled: poolId !== undefined },
  });
}

export function useActivePools(creatorAddress: Address | undefined) {
  return useReadContract({
    ...veildPools.celo,
    functionName: "getActivePools",
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress },
  });
}

export function usePoolContributions(poolId: bigint | undefined) {
  return useReadContract({
    ...veildPools.celo,
    functionName: "getContributions",
    args: poolId !== undefined ? [poolId] : undefined,
    query: { enabled: poolId !== undefined },
  });
}

export function usePoolCount() {
  return useReadContract({
    ...veildPools.celo,
    functionName: "getPoolCount",
    args: [],
  });
}
