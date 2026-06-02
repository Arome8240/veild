"use client";

import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, type Address } from "viem";
import {
  VEILD_MESSAGES_ABI,
  VEILD_REGISTRY_ABI,
  MESSAGES_ADDRESS,
  REGISTRY_ADDRESS,
} from "@/lib/contracts";

/**
 * useVeildContracts
 *
 * Provides typed write helpers and read queries for both Veild contracts.
 * All writes go through wagmi's `useWriteContract` which routes through the
 * connected wallet (MiniPay's window.ethereum when inside MiniPay).
 *
 * MiniPay note: transactions are submitted as legacy type by MiniPay's
 * injected provider automatically — no special handling needed here.
 */
export function useVeildContracts() {
  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // ─── Fan actions ────────────────────────────────────────────────────────────

  function sendMessage(creatorAddress: Address, content: string) {
    writeContract({
      address: MESSAGES_ADDRESS,
      abi: VEILD_MESSAGES_ABI,
      functionName: "sendMessage",
      args: [creatorAddress, content],
    });
  }

  function sendPriorityMessage(
    creatorAddress: Address,
    content: string,
    fee: bigint
  ) {
    writeContract({
      address: MESSAGES_ADDRESS,
      abi: VEILD_MESSAGES_ABI,
      functionName: "sendPriorityMessage",
      args: [creatorAddress, content],
      value: fee,
    });
  }

  function likeWallPost(creatorAddress: Address, wallIndex: bigint) {
    writeContract({
      address: MESSAGES_ADDRESS,
      abi: VEILD_MESSAGES_ABI,
      functionName: "likeWallPost",
      args: [creatorAddress, wallIndex],
    });
  }

  // ─── Creator actions ────────────────────────────────────────────────────────

  function replyToMessage(
    messageIndex: bigint,
    reply: string,
    publishToWall: boolean
  ) {
    writeContract({
      address: MESSAGES_ADDRESS,
      abi: VEILD_MESSAGES_ABI,
      functionName: "replyToMessage",
      args: [messageIndex, reply, publishToWall],
    });
  }

  function publishToWall(messageIndex: bigint) {
    writeContract({
      address: MESSAGES_ADDRESS,
      abi: VEILD_MESSAGES_ABI,
      functionName: "publishToWall",
      args: [messageIndex],
    });
  }

  function archiveMessage(messageIndex: bigint) {
    writeContract({
      address: MESSAGES_ADDRESS,
      abi: VEILD_MESSAGES_ABI,
      functionName: "archiveMessage",
      args: [messageIndex],
    });
  }

  function claimEarnings() {
    writeContract({
      address: MESSAGES_ADDRESS,
      abi: VEILD_MESSAGES_ABI,
      functionName: "claimEarnings",
      args: [],
    });
  }

  function registerCreator(
    username: string,
    name: string,
    bio: string,
    avatarCID: string,
    category: string
  ) {
    writeContract({
      address: REGISTRY_ADDRESS,
      abi: VEILD_REGISTRY_ABI,
      functionName: "register",
      args: [username, name, bio, avatarCID, category],
    });
  }

  return {
    // State
    txHash,
    isPending,       // tx submitted, waiting for wallet confirmation
    isConfirming,    // tx in mempool, waiting for block
    isConfirmed,     // tx mined successfully
    error,
    reset,

    // Fan writes
    sendMessage,
    sendPriorityMessage,
    likeWallPost,

    // Creator writes
    replyToMessage,
    publishToWall,
    archiveMessage,
    claimEarnings,
    registerCreator,
  };
}

// ─── Read hooks (separate so components can use independently) ────────────────

export function useCreatorProfile(address: Address | undefined) {
  return useReadContract({
    address: REGISTRY_ADDRESS,
    abi: VEILD_REGISTRY_ABI,
    functionName: "getCreator",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useIsRegistered(address: Address | undefined) {
  return useReadContract({
    address: REGISTRY_ADDRESS,
    abi: VEILD_REGISTRY_ABI,
    functionName: "isRegistered",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useCreatorByUsername(username: string | undefined) {
  return useReadContract({
    address: REGISTRY_ADDRESS,
    abi: VEILD_REGISTRY_ABI,
    functionName: "getCreatorByUsername",
    args: username ? [username] : undefined,
    query: { enabled: !!username },
  });
}

export function useInbox(creatorAddress: Address | undefined) {
  return useReadContract({
    address: MESSAGES_ADDRESS,
    abi: VEILD_MESSAGES_ABI,
    functionName: "getInbox",
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress },
  });
}

export function useWallPosts(creatorAddress: Address | undefined) {
  return useReadContract({
    address: MESSAGES_ADDRESS,
    abi: VEILD_MESSAGES_ABI,
    functionName: "getWall",
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress },
  });
}

export function useInboxStats(creatorAddress: Address | undefined) {
  return useReadContract({
    address: MESSAGES_ADDRESS,
    abi: VEILD_MESSAGES_ABI,
    functionName: "getInboxStats",
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress },
  });
}

export function useEarnings(creatorAddress: Address | undefined) {
  return useReadContract({
    address: MESSAGES_ADDRESS,
    abi: VEILD_MESSAGES_ABI,
    functionName: "getEarnings",
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress },
  });
}

export function usePriorityFee() {
  return useReadContract({
    address: MESSAGES_ADDRESS,
    abi: VEILD_MESSAGES_ABI,
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
    address: MESSAGES_ADDRESS,
    abi: VEILD_MESSAGES_ABI,
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
