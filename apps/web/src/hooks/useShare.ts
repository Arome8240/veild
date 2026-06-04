"use client";

import { useCallback } from "react";
import { useCopyToClipboard } from "./useCopyToClipboard";

interface ShareData {
  title: string;
  text?: string;
  url: string;
}

/**
 * Attempt the Web Share API; fall back to clipboard copy.
 * Returns `copied` so the UI can show a confirmation badge.
 */
export function useShare() {
  const { copied, copy } = useCopyToClipboard();

  const share = useCallback(
    async (data: ShareData) => {
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share(data);
          return;
        } catch {
          // User cancelled or API unavailable — fall through to clipboard
        }
      }
      copy(data.url);
    },
    [copy]
  );

  return { share, copied };
}
