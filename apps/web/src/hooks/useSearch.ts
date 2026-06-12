"use client";

import { useState, useEffect, useRef } from "react";
import { useReadContract } from "wagmi";
import { veildRegistry } from "@/lib/contracts";
import type { Creator } from "@/lib/contracts";

const DEBOUNCE_MS = 350;

/**
 * Creator username search hook (exact-match via on-chain lookup).
 * Returns a single creator when the debounced query matches a username exactly.
 */
export function useSearch(query: string) {
  const [debounced, setDebounced] = useState(query);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(
      () => setDebounced(query.trim().toLowerCase()),
      DEBOUNCE_MS
    );
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query]);

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
