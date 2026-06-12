"use client";

import { useState } from "react";
import { parseEther, formatEther, type Address } from "viem";
import { useStakeInfo, useBoostScore, useCanWithdraw } from "@/hooks/useStaking";
import type { StakeInfo } from "@/lib/contracts";

interface Props {
  creator:          Address;
  onStake:          (amount: bigint) => void;
  onRequestWithdraw: () => void;
  onWithdraw:       () => void;
}

export function StakingPanel({ creator, onStake, onRequestWithdraw, onWithdraw }: Props) {
  const [input, setInput]   = useState("");
  const { data: infoRaw }   = useStakeInfo(creator);
  const { data: boostRaw }  = useBoostScore(creator);
  const { data: canWithdrawRaw } = useCanWithdraw(creator);

  const info       = infoRaw as StakeInfo | undefined;
  const boost      = boostRaw as bigint | undefined;
  const canWithdraw = Boolean(canWithdrawRaw);

  const staked      = info?.amount ?? 0n;
  const hasPending  = info?.withdrawPending ?? false;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
      <h3 className="font-semibold">Staking</h3>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-xs text-zinc-500">Staked</p>
          <p className="font-bold">{formatEther(staked)} CELO</p>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-xs text-zinc-500">Boost Score</p>
          <p className="font-bold">{boost?.toString() ?? "0"}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Amount (CELO)"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
        <button
          disabled={!input || Number(input) <= 0}
          onClick={() => { onStake(parseEther(input)); setInput(""); }}
          className="rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-300 hover:bg-blue-500/30 disabled:opacity-40 transition-colors"
        >
          Stake
        </button>
      </div>

      {staked > 0n && !hasPending && (
        <button
          onClick={onRequestWithdraw}
          className="w-full rounded-lg border border-white/10 py-2 text-sm text-zinc-400 hover:bg-white/5 transition-colors"
        >
          Request Withdrawal (7-day cooldown)
        </button>
      )}

      {hasPending && canWithdraw && (
        <button
          onClick={onWithdraw}
          className="w-full rounded-lg bg-green-500/20 py-2 text-sm font-medium text-green-300 hover:bg-green-500/30 transition-colors"
        >
          Withdraw Staked CELO
        </button>
      )}

      {hasPending && !canWithdraw && (
        <p className="text-center text-xs text-zinc-500">Cooldown in progress…</p>
      )}
    </div>
  );
}
