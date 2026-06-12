"use client";

import { useState, useEffect } from "react";

/**
 * Returns `true` after the component mounts on the client.
 * Useful to suppress SSR hydration mismatches for client-only UI.
 */
export function useIsMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted;
}
