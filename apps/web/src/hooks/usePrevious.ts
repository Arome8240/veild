"use client";

import { useRef, useEffect } from "react";

/** Returns the value of `current` from the previous render. */
export function usePrevious<T>(current: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => { ref.current = current; });
  return ref.current;
}
