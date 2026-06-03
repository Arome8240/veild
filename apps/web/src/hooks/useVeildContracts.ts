"use client";

import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { type Address } from "viem";
import { veildRegistry, veildMessages } from "@/lib/contracts";

/**
 * useVeildContracts
 *
 * Write helpers and read queries for both Veild contracts, powered by veild-sdk.
 * veildRegistry.celo / veildMessages.celo carry the address + ABI together so
 * each contract call is a single spread instead of repeating address and abi.
 */
export function useVeildContracts() {
  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  // ─── Fan writes ─────────────────────────────────────────────────────────────

  function sendMessage(creatorAddress: Address, content: string) {
    writeContract({
      ...veildMessages.celo,
      functionName: "sendMessage",
      args: [creatorAddress, content],
    });
  }

  function sendPriorityMessage(creatorAddress: Address, content: string, fee: bigint) {
    writeContract({
      ...veildMessages.celo,
      functionName: "sendPriorityMessage",
      args: [creatorAddress, content],
      value: fee,
    });
  }

  function likeWallPost(creatorAddress: Address, wallIndex: bigint) {
    writeContract({
      ...veildMessages.celo,
      functionName: "likeWallPost",
      args: [creatorAddress, wallIndex],
    });
  }

  // ─── Creator writes ──────────────────────────────────────────────────────────

  function replyToMessage(messageIndex: bigint, reply: string, publishToWall: boolean) {
    writeContract({
      ...veildMessages.celo,
      functionName: "replyToMessage",
      args: [messageIndex, reply, publishToWall],
    });
  }

  function publishToWall(messageIndex: bigint) {
    writeContract({
      ...veildMessages.celo,
      functionName: "publishToWall",
      args: [messageIndex],
    });
  }

  function archiveMessage(messageIndex: bigint) {
    writeContract({
      ...veildMessages.celo,
      functionName: "archiveMessage",
      args: [messageIndex],
    });
  }

  function claimEarnings() {
    writeContract({
      ...veildMessages.celo,
      functionName: "claimEarnings",
      args: [],
    });
  }

  function registerCreator(
    username: string, name: string, bio: string,
    avatarCID: string, category: string
  ) {
    writeContract({
      ...veildRegistry.celo,
      functionName: "register",
      args: [username, name, bio, avatarCID, category],
    });
  }

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
