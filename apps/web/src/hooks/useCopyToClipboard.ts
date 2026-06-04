"use client";

import { useState, useCallback } from "react";
import { COPY_FEEDBACK_MS } from "@/constants/config";

/**
 * Copy text to the clipboard and expose a transient `copied` state.
 * Falls back to `document.execCommand` when Clipboard API is unavailable.
 */
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback((text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(console.warn);
    } else {
      // Legacy fallback
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.focus();
      el.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(el);
    }
    setCopied(true);
    const timer = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, []);

  return { copied, copy };
}
