"use client";

import { useReadContract } from "wagmi";
import { veildRegistry } from "@/lib/contracts";
import type { Creator } from "@/lib/contracts";
import { useDebounce } from "./useDebounce";

/**
 * Creator username search hook (exact-match via on-chain lookup).
 * Returns a single creator when the debounced query matches a username exactly.
 */
export function useSearch(query: string) {
  const debounced = useDebounce(query.trim().toLowerCase(), 350);

  const enabled = debounced.length >= 2;

  const result = useReadContract({
    ...veildRegistry.celo,
    functionName: "getCreatorByUsername",
    args: enabled ? [debounced] : undefined,
    query: { enabled },
  });

  const found = result.data as Creator | undefined;
  const results: Creator[] = found && found.isActive ? [found] : [];

  return {
    results,
    isLoading: result.isLoading,
    query:     debounced,
  };
}
