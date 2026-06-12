"use client";

import { useState, useCallback } from "react";

/**
 * Generic localStorage hook with JSON serialisation.
 * SSR-safe — reads only on client, returns initial on server.
 */
export function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void, () => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  const set = useCallback((v: T) => {
    setValue(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage full */ }
  }, [key]);

  const remove = useCallback(() => {
    setValue(initial);
    try { localStorage.removeItem(key); } catch { /* ok */ }
  }, [key, initial]);

  return [value, set, remove];
}
