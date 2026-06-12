"use client";

import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { type Address } from "viem";
import { veildGifts, type GiftRecord, type GiftType } from "@/lib/contracts";

export function useVeildGifts() {
  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  function sendGift(creator: Address, giftTypeId: bigint, message: string, amount: bigint) {
    writeContract({
      ...veildGifts.celo,
      functionName: "sendGift",
      args: [creator, giftTypeId, message],
      value: amount,
    });
  }

  function claimGiftEarnings() {
    writeContract({
      ...veildGifts.celo,
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
    sendGift,
    claimGiftEarnings,
  };
}

export function useCreatorGifts(creator: Address | undefined) {
  const result = useReadContract({
    ...veildGifts.celo,
    functionName: "getGifts",
    args: creator ? [creator] : undefined,
    query: { enabled: !!creator },
  });
  return { ...result, data: (result.data as GiftRecord[] | undefined) ?? [] };
}

export function useGiftType(giftTypeId: bigint | undefined) {
  const result = useReadContract({
    ...veildGifts.celo,
    functionName: "getGiftType",
    args: giftTypeId !== undefined ? [giftTypeId] : undefined,
    query: { enabled: giftTypeId !== undefined },
  });
  return { ...result, data: result.data as GiftType | undefined };
}

export function useGiftEarnings(creator: Address | undefined) {
  const result = useReadContract({
    ...veildGifts.celo,
    functionName: "earnings",
    args: creator ? [creator] : undefined,
    query: { enabled: !!creator },
  });
  return { ...result, data: (result.data as bigint | undefined) ?? 0n };
}

export function useGiftTypeCount() {
  const result = useReadContract({
    ...veildGifts.celo,
    functionName: "giftTypeCount",
    args: [],
  });
  return { ...result, data: (result.data as bigint | undefined) ?? 0n };
}
