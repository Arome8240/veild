"use client";

import { useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useChain } from "@/lib/chain-context";
import { useStacksWallet } from "@/hooks/useStacksWallet";

function shortenAddress(addr: string): string {
  if (addr.startsWith("0x")) {
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  }
  // Stacks principal: SP1ABC…XYZ.suffix or just the principal
  const parts = addr.split(".");
  const base  = parts[0] ?? addr;
  return `${base.slice(0, 8)}…${base.slice(-4)}`;
}

export function ConnectButton() {
  const [mounted, setMounted] = useState(false);

  const { activeChain, setChain } = useChain();
  const { address: celoAddress, isConnected: isCeloConnected } = useAccount();
  const { disconnect: disconnectCelo } = useDisconnect();
  const { address: stacksAddress, isConnected: isStacksConnected, connect: connectStacks, disconnect: disconnectStacks } =
    useStacksWallet();

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2">
      {/* ── Celo wallet ───────────────────────────────────── */}
      {isCeloConnected ? (
        <button
          type="button"
          onClick={() => {
            setChain("celo");
            disconnectCelo();
          }}
          aria-label={`Celo wallet: ${shortenAddress(celoAddress!)} — click to disconnect`}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors
            ${activeChain === "celo"
              ? "bg-yellow-400/20 text-yellow-700 dark:text-yellow-300 ring-1 ring-yellow-400"
              : "bg-surface-2 text-muted hover:bg-surface-3"
            }`}
        >
          <span className="size-2 rounded-full bg-green-500" aria-hidden="true" />
          {shortenAddress(celoAddress!)}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setChain("celo")}
          disabled
          aria-label="Celo wallet not connected"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium
            bg-surface-2 text-muted cursor-not-allowed opacity-60"
        >
          <span className="size-2 rounded-full bg-zinc-400" aria-hidden="true" />
          Celo
        </button>
      )}

      {/* ── Stacks wallet ─────────────────────────────────── */}
      {isStacksConnected ? (
        <button
          type="button"
          onClick={() => {
            setChain("stacks");
            disconnectStacks();
          }}
          aria-label={`Stacks wallet: ${shortenAddress(stacksAddress!)} — click to disconnect`}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors
            ${activeChain === "stacks"
              ? "bg-orange-400/20 text-orange-700 dark:text-orange-300 ring-1 ring-orange-400"
              : "bg-surface-2 text-muted hover:bg-surface-3"
            }`}
        >
          <span className="size-2 rounded-full bg-green-500" aria-hidden="true" />
          {shortenAddress(stacksAddress!)}
        </button>
      ) : (
        <button
          type="button"
          onClick={connectStacks}
          aria-label="Connect Stacks wallet"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium
            bg-orange-500/10 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20 transition-colors"
        >
          <span className="size-2 rounded-full bg-orange-400" aria-hidden="true" />
          Connect Stacks
        </button>
      )}
    </div>
  );
}
