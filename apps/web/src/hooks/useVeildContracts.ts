"use client";

import { useCallback } from "react";
import { useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { type Address } from "viem";
import { veildRegistry, veildMessages } from "@/lib/contracts";
import { useCeloWrite } from "./useCeloWrite";

/**
 * useVeildContracts
 *
 * Write helpers and read queries for both Veild contracts, powered by veild-sdk.
 * veildRegistry.celo / veildMessages.celo carry the address + ABI together so
 * each contract call is a single spread instead of repeating address and abi.
 */
export function useVeildContracts() {
  const { writeContract, data: txHash, isPending, error, reset } = useCeloWrite();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  // ─── Fan writes ─────────────────────────────────────────────────────────────

  const sendMessage = useCallback((creatorAddress: Address, content: string) => {
    writeContract({
      ...veildMessages.celo,
      functionName: "sendMessage",
      args: [creatorAddress, content],
    });
  }, [writeContract]);

  const sendPriorityMessage = useCallback((creatorAddress: Address, content: string, fee: bigint) => {
    writeContract({
      ...veildMessages.celo,
      functionName: "sendPriorityMessage",
      args: [creatorAddress, content],
      value: fee,
    });
  }, [writeContract]);

  const likeWallPost = useCallback((creatorAddress: Address, wallIndex: bigint) => {
    writeContract({
      ...veildMessages.celo,
      functionName: "likeWallPost",
      args: [creatorAddress, wallIndex],
    });
  }, [writeContract]);

  // ─── Creator writes ──────────────────────────────────────────────────────────

  const replyToMessage = useCallback((messageIndex: bigint, reply: string, publish: boolean) => {
    writeContract({
      ...veildMessages.celo,
      functionName: "replyToMessage",
      args: [messageIndex, reply, publish],
    });
  }, [writeContract]);

  const publishToWall = useCallback((messageIndex: bigint) => {
    writeContract({
      ...veildMessages.celo,
      functionName: "publishToWall",
      args: [messageIndex],
    });
  }, [writeContract]);

  const archiveMessage = useCallback((messageIndex: bigint) => {
    writeContract({
      ...veildMessages.celo,
      functionName: "archiveMessage",
      args: [messageIndex],
    });
  }, [writeContract]);

  const claimEarnings = useCallback(() => {
    writeContract({
      ...veildMessages.celo,
      functionName: "claimEarnings",
      args: [],
    });
  }, [writeContract]);

  const registerCreator = useCallback((
    username: string, name: string, bio: string,
    avatarCID: string, category: string
  ) => {
    writeContract({
      ...veildRegistry.celo,
      functionName: "register",
      args: [username, name, bio, avatarCID, category],
    });
  }, [writeContract]);

  const updateProfile = useCallback((
    name: string, bio: string,
    avatarCID: string, category: string
  ) => {
    writeContract({
      ...veildRegistry.celo,
      functionName: "updateProfile",
      args: [name, bio, avatarCID, category],
    });
  }, [writeContract]);

  return {
    txHash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    reset,
    sendMessage,
    sendPriorityMessage,
    likeWallPost,
    replyToMessage,
    publishToWall,
    archiveMessage,
    claimEarnings,
    registerCreator,
    updateProfile,
  };
}

// ─── Read hooks ───────────────────────────────────────────────────────────────

export function useCreatorProfile(address: Address | undefined) {
  return useReadContract({
    ...veildRegistry.celo,
    functionName: "getCreator",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useIsRegistered(address: Address | undefined) {
  return useReadContract({
    ...veildRegistry.celo,
    functionName: "isRegistered",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useCreatorByUsername(username: string | undefined) {
  return useReadContract({
    ...veildRegistry.celo,
    functionName: "getCreatorByUsername",
    args: username ? [username] : undefined,
    query: { enabled: !!username },
  });
}

export function useInbox(creatorAddress: Address | undefined) {
  return useReadContract({
    ...veildMessages.celo,
    functionName: "getInbox",
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress },
  });
}

export function useWallPosts(creatorAddress: Address | undefined) {
  return useReadContract({
    ...veildMessages.celo,
    functionName: "getWall",
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress },
  });
}

export function useInboxStats(creatorAddress: Address | undefined) {
  return useReadContract({
    ...veildMessages.celo,
    functionName: "getInboxStats",
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress },
  });
}

export function useEarnings(creatorAddress: Address | undefined) {
  return useReadContract({
    ...veildMessages.celo,
    functionName: "getEarnings",
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress },
  });
}

export function usePriorityFee() {
  return useReadContract({
    ...veildMessages.celo,
    functionName: "priorityFee",
    args: [],
  });
}

export function useHasLiked(
  creatorAddress: Address | undefined,
  wallIndex: bigint | undefined,
  userAddress: Address | undefined
) {
  return useReadContract({
    ...veildMessages.celo,
    functionName: "hasLiked",
    args:
      creatorAddress && wallIndex !== undefined && userAddress
        ? [creatorAddress, wallIndex, userAddress]
        : undefined,
    query: {
      enabled: !!creatorAddress && wallIndex !== undefined && !!userAddress,
    },
  });
}
