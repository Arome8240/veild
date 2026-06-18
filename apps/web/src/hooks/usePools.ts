"use client";

import { useCallback } from "react";
import { useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { useCeloWrite } from "./useCeloWrite";
import { type Address } from "viem";
import { veildPools, type Pool, type Contribution } from "@/lib/contracts";

/**
 * useVeildPools — write and read hooks for VeildPools.
 *
 * Fan actions: createPool, contribute, claimRefund
 * Creator actions: answerPool
 * Public actions: markExpired
 */
export function useVeildPools() {
  const { writeContract, data: txHash, isPending, error, reset } = useCeloWrite();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const createPool = useCallback((
    creatorAddress: Address,
    question: string,
    duration: bigint,
    amount: bigint
  ) => {
    writeContract({
      ...veildPools.celo,
      functionName: "createPool",
      args: [creatorAddress, question, duration],
      value: amount,
    });
  }, [writeContract]);

  const contribute = useCallback((poolId: bigint, amount: bigint) => {
    writeContract({
      ...veildPools.celo,
      functionName: "contribute",
      args: [poolId],
      value: amount,
    });
  }, [writeContract]);

  const answerPool = useCallback((poolId: bigint, answer: string) => {
    writeContract({
      ...veildPools.celo,
      functionName: "answerPool",
      args: [poolId, answer],
    });
  }, [writeContract]);

  const markExpired = useCallback((poolId: bigint) => {
    writeContract({
      ...veildPools.celo,
      functionName: "markExpired",
      args: [poolId],
    });
  }, [writeContract]);

  const claimRefund = useCallback((poolId: bigint, contribIndex: bigint) => {
    writeContract({
      ...veildPools.celo,
      functionName: "claimRefund",
      args: [poolId, contribIndex],
    });
  }, [writeContract]);

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
  const result = useReadContract({
    ...veildPools.celo,
    functionName: "getPool",
    args: poolId !== undefined ? [poolId] : undefined,
    query: { enabled: poolId !== undefined },
  });
  return { ...result, data: result.data as Pool | undefined };
}

export function useActivePools(creatorAddress: Address | undefined) {
  const result = useReadContract({
    ...veildPools.celo,
    functionName: "getActivePools",
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress },
  });
  return { ...result, data: (result.data as Pool[] | undefined) ?? [] };
}

export function usePoolContributions(poolId: bigint | undefined) {
  const result = useReadContract({
    ...veildPools.celo,
    functionName: "getContributions",
    args: poolId !== undefined ? [poolId] : undefined,
    query: { enabled: poolId !== undefined },
  });
  return { ...result, data: (result.data as Contribution[] | undefined) ?? [] };
}

export function usePoolCount() {
  return useReadContract({
    ...veildPools.celo,
    functionName: "getPoolCount",
    args: [],
  });
}
