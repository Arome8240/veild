"use client";

import { useState, useCallback } from "react";
import { type Address } from "viem";

const STORAGE_KEY = "veild_pinned_messages";

function readPinned(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn("[usePinnedMessage] Corrupted localStorage data, resetting:", err);
    localStorage.removeItem(STORAGE_KEY);
    return {};
  }
}

function writePinned(record: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

/**
 * Per-creator pinned message — stored client-side per session.
 * The creator's wallet address is the key.
 */
export function usePinnedMessage(creator: Address | undefined) {
  const [pinned, setPinned] = useState<Record<string, string>>(readPinned);

  const pinnedId = creator ? (pinned[creator] ?? null) : null;

  const pin = useCallback(
    (messageId: string) => {
      if (!creator) return;
      setPinned((prev) => {
        const next = { ...prev, [creator]: messageId };
        writePinned(next);
        return next;
      });
    },
    [creator]
  );

  const unpin = useCallback(() => {
    if (!creator) return;
    setPinned((prev) => {
      const next = { ...prev };
      delete next[creator];
      writePinned(next);
      return next;
    });
  }, [creator]);

  return { pinnedId, pin, unpin };
}
