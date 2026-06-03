"use client";

import { useAccount } from "wagmi";
import {
  useCreatorProfile,
  useInboxStats,
  useEarnings,
  useWallPosts,
  useIsRegistered,
} from "./useVeildContracts";
import type { Address } from "viem";

/**
 * useCurrentCreator
 *
 * Single hook that aggregates everything the app needs about
 * the currently connected wallet's on-chain creator profile.
 */
export function useCurrentCreator() {
  const { address, isConnected } = useAccount();

  const { data: isRegistered, isLoading: loadingReg } = useIsRegistered(
    address as Address | undefined
  );
  const { data: profile, isLoading: loadingProfile, refetch: refetchProfile } =
    useCreatorProfile(address as Address | undefined);
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } =
    useInboxStats(address as Address | undefined);
  const { data: earnings, isLoading: loadingEarnings } = useEarnings(
    address as Address | undefined
  );
  const { data: wallPosts, isLoading: loadingWall, refetch: refetchWall } =
    useWallPosts(address as Address | undefined);

  const isLoading =
    loadingReg || loadingProfile || loadingStats || loadingEarnings;

  async function refetch() {
    await Promise.all([refetchProfile(), refetchStats(), refetchWall()]);
  }

  return {
    address: address as Address | undefined,
    isConnected,
    isRegistered: isRegistered ?? false,
    profile,
    stats,
    earnings: earnings ?? 0n,
    wallPosts: wallPosts ?? [],
    isLoading,
    refetch,
  };
}
