"use client";

import { useState } from "react";

interface Props {
  url:    string;
  title?: string;
}

export function ShareSheet({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied — fall back to selecting the input text
      const input = document.querySelector<HTMLInputElement>(`input[value="${CSS.escape(url)}"]`);
      input?.select();
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title, url });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={url}
        aria-label="Share URL"
        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-400 font-mono truncate focus:outline-none"
      />
      <button
        onClick={handleCopy}
        className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5 transition-colors"
        aria-label="Copy link"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      {"share" in navigator && (
        <button
          onClick={handleNativeShare}
          className="rounded-lg border border-white/10 p-2 hover:bg-white/5 transition-colors"
          aria-label="Share"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
