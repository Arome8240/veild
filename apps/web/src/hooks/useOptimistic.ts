"use client";

import { useState, useCallback } from "react";

/**
 * Thin optimistic update helper.
 * Apply a mutation locally, roll back if the async action throws.
 */
export function useOptimistic<T>(serverState: T) {
  const [optimistic, setOptimistic] = useState<T>(serverState);

  const mutate = useCallback(async (
    optimisticValue: T,
    action:          () => Promise<void>
  ) => {
    setOptimistic(optimisticValue);
    try {
      await action();
    } catch {
      setOptimistic(serverState);
      throw new Error("Action failed, reverting optimistic update");
    }
  }, [serverState]);

  return [optimistic, mutate] as const;
}
