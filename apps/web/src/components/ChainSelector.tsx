"use client";

import { useChain, type SupportedChain } from "@/lib/chain-context";

const CHAINS: { id: SupportedChain; label: string; emoji: string }[] = [
  { id: "celo",   label: "Celo",   emoji: "🌱" },
  { id: "stacks", label: "Stacks", emoji: "🟧" },
];

export function ChainSelector() {
  const { activeChain, setChain } = useChain();

  return (
    <div
      role="group"
      aria-label="Switch blockchain"
      className="flex items-center gap-1 rounded-full bg-surface-2 p-0.5"
    >
      {CHAINS.map(({ id, label, emoji }) => (
        <button
          key={id}
          type="button"
          onClick={() => setChain(id)}
          aria-pressed={activeChain === id}
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all
            ${activeChain === id
              ? "bg-white dark:bg-zinc-800 text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
            }`}
        >
          <span aria-hidden>{emoji}</span>
          {label}
        </button>
      ))}
    </div>
  );
}
