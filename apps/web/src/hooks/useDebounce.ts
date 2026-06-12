"use client";

import { useState, useEffect } from "react";

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms
 * of inactivity. Useful for search inputs and autocomplete.
 */
export function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
