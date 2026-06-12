"use client";

import { type Address } from "viem";
import { useClipboard } from "@/hooks/useClipboard";

interface Props {
  address:    Address;
  chars?:     number;
  className?: string;
}

export function AddressChip({ address, chars = 4, className = "" }: Props) {
  const { copied, copy } = useClipboard();
  const short = `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;

  return (
    <button
      onClick={() => copy(address)}
      aria-label={copied ? "Copied!" : `Copy address ${address}`}
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-xs hover:bg-white/10 transition-colors ${className}`}
    >
      {short}
      <span aria-hidden="true" className="text-zinc-500 text-[10px]">
        {copied ? "✓" : "⎘"}
      </span>
    </button>
  );
}
