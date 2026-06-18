"use client";

import { useCallback } from "react";
import { useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { useCeloWrite } from "./useCeloWrite";
import { type Address } from "viem";
import { veildSubscriptions } from "@/lib/contracts";
import type { SubscriptionTier, Subscription } from "@/lib/contracts";

export function useVeildSubscriptions() {
  const { writeContract, data: txHash, isPending, error, reset } = useCeloWrite();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const subscribe = useCallback((creator: Address, tierId: bigint, value: bigint) => {
    writeContract({
      ...veildSubscriptions.celo,
      functionName: "subscribe",
      args:  [creator, tierId],
      value,
    });
  }, [writeContract]);

  const createTier = useCallback((pricePerMonth: bigint, label: string) => {
    writeContract({
      ...veildSubscriptions.celo,
      functionName: "createTier",
      args:  [pricePerMonth, label],
    });
  }, [writeContract]);

  const claimSubEarnings = useCallback(() => {
    writeContract({
      ...veildSubscriptions.celo,
      functionName: "claimEarnings",
      args:  [],
    });
  }, [writeContract]);

  return { subscribe, createTier, claimSubEarnings, isPending, isConfirming, isConfirmed, error, reset };
}

export function useCreatorTiers(creator: Address | undefined) {
  const result = useReadContract({
    ...veildSubscriptions.celo,
    functionName: "getTiers",
    args:         creator ? [creator] : undefined,
    query:        { enabled: !!creator },
  });
  return { ...result, data: result.data as SubscriptionTier[] | undefined };
}

export function useActiveSubscription(creator: Address | undefined, subscriber: Address | undefined) {
  const result = useReadContract({
    ...veildSubscriptions.celo,
    functionName: "getSubscription",
    args:         creator && subscriber ? [creator, subscriber] : undefined,
    query:        { enabled: !!creator && !!subscriber },
  });
  return { ...result, data: result.data as Subscription | undefined };
}

export function useIsSubscribed(creator: Address | undefined, fan: Address | undefined) {
  const result = useReadContract({
    ...veildSubscriptions.celo,
    functionName: "isSubscribed",
    args:         creator && fan ? [creator, fan] : undefined,
    query:        { enabled: !!creator && !!fan },
  });
  return { ...result, data: result.data as boolean | undefined };
}

export function useSubEarnings(creator: Address | undefined) {
  const result = useReadContract({
    ...veildSubscriptions.celo,
    functionName: "getEarnings",
    args:         creator ? [creator] : undefined,
    query:        { enabled: !!creator },
  });
  return { ...result, data: result.data as bigint | undefined };
}
