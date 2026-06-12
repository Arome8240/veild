"use client";

import { useReadContract } from "wagmi";
import { type Address } from "viem";
import { veildRegistry } from "@/lib/contracts";
import type { Creator } from "@/lib/contracts";

/** Read a creator's profile by address. */
export function useCreatorByAddress(address: Address | undefined) {
  const result = useReadContract({
    ...veildRegistry.celo,
    functionName: "getCreator",
    args:         address ? [address] : undefined,
    query:        { enabled: !!address },
  });
  return { ...result, data: result.data as Creator | undefined };
}

/** Read a creator's profile by username. */
export function useCreatorByUsername(username: string | undefined) {
  const result = useReadContract({
    ...veildRegistry.celo,
    functionName: "getCreatorByUsername",
    args:         username ? [username] : undefined,
    query:        { enabled: !!username && username.length >= 2 },
  });
  return { ...result, data: result.data as Creator | undefined };
}

/** Check if an address is a registered Veild creator. */
export function useIsRegistered(address: Address | undefined) {
  const result = useReadContract({
    ...veildRegistry.celo,
    functionName: "isRegistered",
    args:         address ? [address] : undefined,
    query:        { enabled: !!address },
  });
  return { ...result, data: result.data as boolean | undefined };
}

/** Return the current registration fee in wei. */
export function useRegistrationFee() {
  const result = useReadContract({
    ...veildRegistry.celo,
    functionName: "registrationFee",
    args:         [],
  });
  return { ...result, data: result.data as bigint | undefined };
}
