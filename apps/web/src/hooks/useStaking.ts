"use client";

import { useCallback } from "react";
import { useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { useCeloWrite } from "./useCeloWrite";
import { type Address } from "viem";
import { veildStaking, type StakeInfo } from "@/lib/contracts";

export function useVeildStaking() {
  const { writeContract, data: txHash, isPending, error, reset } = useCeloWrite();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const stake = useCallback((amount: bigint) => {
    writeContract({
      ...veildStaking.celo,
      functionName: "stake",
      args: [],
      value: amount,
    });
  }, [writeContract]);

  const requestWithdraw = useCallback(() => {
    writeContract({
      ...veildStaking.celo,
      functionName: "requestWithdraw",
      args: [],
    });
  }, [writeContract]);

  const withdraw = useCallback(() => {
    writeContract({
      ...veildStaking.celo,
      functionName: "withdraw",
      args: [],
    });
  }, [writeContract]);

  return {
    txHash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    reset,
    stake,
    requestWithdraw,
    withdraw,
  };
}

export function useStakeInfo(creator: Address | undefined) {
  const result = useReadContract({
    ...veildStaking.celo,
    functionName: "getStake",
    args: creator ? [creator] : undefined,
    query: { enabled: !!creator },
  });
  return { ...result, data: result.data as StakeInfo | undefined };
}

export function useBoostScore(creator: Address | undefined) {
  const result = useReadContract({
    ...veildStaking.celo,
    functionName: "boostScore",
    args: creator ? [creator] : undefined,
    query: { enabled: !!creator },
  });
  return { ...result, data: (result.data as bigint | undefined) ?? 0n };
}

export function useCanWithdraw(creator: Address | undefined) {
  const result = useReadContract({
    ...veildStaking.celo,
    functionName: "canWithdraw",
    args: creator ? [creator] : undefined,
    query: { enabled: !!creator },
  });
  return { ...result, data: (result.data as boolean | undefined) ?? false };
}

export function useTotalStaked() {
  const result = useReadContract({
    ...veildStaking.celo,
    functionName: "totalStaked",
    args: [],
  });
  return { ...result, data: (result.data as bigint | undefined) ?? 0n };
}
