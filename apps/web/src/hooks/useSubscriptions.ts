"use client";

import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { type Address } from "viem";
import { veildSubscriptions } from "@/lib/contracts";

/**
 * useVeildSubscriptions — write actions for VeildSubscriptions.
 *
 * Creator actions: createTier, updateTierPrice, deactivateTier, claimSubEarnings
 * Fan actions: subscribe
 */
export function useVeildSubscriptions() {
  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  // ── Creator ──────────────────────────────────────────────────────────────

  function createTier(pricePerMonth: bigint, label: string) {
    writeContract({
      ...veildSubscriptions.celo,
      functionName: "createTier",
      args: [pricePerMonth, label],
    });
  }

  function updateTierPrice(tierId: bigint, newPrice: bigint) {
    writeContract({
      ...veildSubscriptions.celo,
      functionName: "updateTierPrice",
      args: [tierId, newPrice],
    });
  }

  function deactivateTier(tierId: bigint) {
    writeContract({
      ...veildSubscriptions.celo,
      functionName: "deactivateTier",
      args: [tierId],
    });
  }

  function claimSubEarnings() {
    writeContract({
      ...veildSubscriptions.celo,
      functionName: "claimEarnings",
      args: [],
    });
  }

  // ── Fan ──────────────────────────────────────────────────────────────────

  function subscribe(creatorAddress: Address, tierId: bigint, amount: bigint) {
    writeContract({
      ...veildSubscriptions.celo,
      functionName: "subscribe",
      args: [creatorAddress, tierId],
      value: amount,
    });
  }

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
  return useReadContract({
    ...veildSubscriptions.celo,
    functionName: "isSubscribed",
    args: creatorAddress && fanAddress ? [creatorAddress, fanAddress] : undefined,
    query: { enabled: !!creatorAddress && !!fanAddress },
  });
}

export function useSubscriptionDetails(
  creatorAddress: Address | undefined,
  fanAddress: Address | undefined
) {
  return useReadContract({
    ...veildSubscriptions.celo,
    functionName: "getSubscription",
    args: creatorAddress && fanAddress ? [creatorAddress, fanAddress] : undefined,
    query: { enabled: !!creatorAddress && !!fanAddress },
  });
}

export function useCreatorTiers(creatorAddress: Address | undefined) {
  return useReadContract({
    ...veildSubscriptions.celo,
    functionName: "getTiers",
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress },
  });
}

export function useSubEarnings(creatorAddress: Address | undefined) {
  return useReadContract({
    ...veildSubscriptions.celo,
    functionName: "getEarnings",
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress },
  });
}

export function useSubscriberCount(creatorAddress: Address | undefined) {
  return useReadContract({
    ...veildSubscriptions.celo,
    functionName: "subscriberCount",
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress },
  });
}
