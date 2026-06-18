"use client";

import { useCallback } from "react";
import { useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { useCeloWrite } from "./useCeloWrite";
import { veildAuction, type Auction } from "@/lib/contracts";

export function useVeildAuction() {
  const { writeContract, data: txHash, isPending, error, reset } = useCeloWrite();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const createAuction = useCallback((label: string, minBid: bigint, duration: bigint) => {
    writeContract({
      ...veildAuction.celo,
      functionName: "createAuction",
      args: [label, minBid, duration],
    });
  }, [writeContract]);

  const placeBid = useCallback((auctionId: bigint, amount: bigint) => {
    writeContract({
      ...veildAuction.celo,
      functionName: "placeBid",
      args: [auctionId],
      value: amount,
    });
  }, [writeContract]);

  const claimWin = useCallback((auctionId: bigint) => {
    writeContract({
      ...veildAuction.celo,
      functionName: "claimWin",
      args: [auctionId],
    });
  }, [writeContract]);

  const cancelAuction = useCallback((auctionId: bigint) => {
    writeContract({
      ...veildAuction.celo,
      functionName: "cancelAuction",
      args: [auctionId],
    });
  }, [writeContract]);

  return {
    txHash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    reset,
    createAuction,
    placeBid,
    claimWin,
    cancelAuction,
  };
}

export function useAuction(auctionId: bigint | undefined) {
  const result = useReadContract({
    ...veildAuction.celo,
    functionName: "getAuction",
    args: auctionId !== undefined ? [auctionId] : undefined,
    query: { enabled: auctionId !== undefined },
  });
  return { ...result, data: result.data as Auction | undefined };
}

export function useAuctionCount() {
  const result = useReadContract({
    ...veildAuction.celo,
    functionName: "auctionCount",
    args: [],
  });
  return { ...result, data: (result.data as bigint | undefined) ?? 0n };
}

export function useIsAuctionActive(auctionId: bigint | undefined) {
  const result = useReadContract({
    ...veildAuction.celo,
    functionName: "isActive",
    args: auctionId !== undefined ? [auctionId] : undefined,
    query: { enabled: auctionId !== undefined },
  });
  return { ...result, data: (result.data as boolean | undefined) ?? false };
}
