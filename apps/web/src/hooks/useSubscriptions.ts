"use client";

import { useCallback } from "react";
import { useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { useCeloWrite } from "./useCeloWrite";
import { type Address } from "viem";
import { veildSubscriptions, type SubscriptionTier, type Subscription } from "@/lib/contracts";

/**
 * useVeildSubscriptions — write actions for VeildSubscriptions.
 *
 * Creator actions: createTier, updateTierPrice, deactivateTier, claimSubEarnings
 * Fan actions: subscribe
 */
export function useVeildSubscriptions() {
  const { writeContract, data: txHash, isPending, error, reset } = useCeloWrite();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  // ── Creator ──────────────────────────────────────────────────────────────

  const createTier = useCallback((pricePerMonth: bigint, label: string) => {
    writeContract({
      ...veildSubscriptions.celo,
      functionName: "createTier",
      args: [pricePerMonth, label],
    });
  }, [writeContract]);

  const updateTierPrice = useCallback((tierId: bigint, newPrice: bigint) => {
    writeContract({
      ...veildSubscriptions.celo,
      functionName: "updateTierPrice",
      args: [tierId, newPrice],
    });
  }, [writeContract]);

  const deactivateTier = useCallback((tierId: bigint) => {
    writeContract({
      ...veildSubscriptions.celo,
      functionName: "deactivateTier",
      args: [tierId],
    });
  }, [writeContract]);

  const claimSubEarnings = useCallback(() => {
    writeContract({
      ...veildSubscriptions.celo,
      functionName: "claimEarnings",
      args: [],
    });
  }, [writeContract]);

  // ── Fan ──────────────────────────────────────────────────────────────────

  const subscribe = useCallback((creatorAddress: Address, tierId: bigint, amount: bigint) => {
    writeContract({
      ...veildSubscriptions.celo,
      functionName: "subscribe",
      args: [creatorAddress, tierId],
      value: amount,
    });
  }, [writeContract]);

  return {
    txHash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    reset,
    createTier,
    updateTierPrice,
    deactivateTier,
    claimSubEarnings,
    subscribe,
  };
}

// ─── Read hooks ───────────────────────────────────────────────────────────────

export function useIsSubscribed(
  creatorAddress: Address | undefined,
  fanAddress: Address | undefined
) {
  const result = useReadContract({
    ...veildSubscriptions.celo,
    functionName: "isSubscribed",
    args: creatorAddress && fanAddress ? [creatorAddress, fanAddress] : undefined,
    query: { enabled: !!creatorAddress && !!fanAddress },
  });
  return { ...result, data: result.data as boolean | undefined };
}

export function useSubscriptionDetails(
  creatorAddress: Address | undefined,
  fanAddress: Address | undefined
) {
  const result = useReadContract({
    ...veildSubscriptions.celo,
    functionName: "getSubscription",
    args: creatorAddress && fanAddress ? [creatorAddress, fanAddress] : undefined,
    query: { enabled: !!creatorAddress && !!fanAddress },
  });
  return { ...result, data: result.data as Subscription | undefined };
}

export function useCreatorTiers(creatorAddress: Address | undefined) {
  const result = useReadContract({
    ...veildSubscriptions.celo,
    functionName: "getTiers",
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress },
  });
  return { ...result, data: (result.data as SubscriptionTier[] | undefined) ?? [] };
}

export function useSubEarnings(creatorAddress: Address | undefined) {
  const result = useReadContract({
    ...veildSubscriptions.celo,
    functionName: "getEarnings",
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress },
  });
  return { ...result, data: (result.data as bigint | undefined) ?? 0n };
}

export function useSubscriberCount(creatorAddress: Address | undefined) {
  const result = useReadContract({
    ...veildSubscriptions.celo,
    functionName: "subscriberCount",
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress },
  });
  return { ...result, data: (result.data as bigint | undefined) ?? 0n };
}
