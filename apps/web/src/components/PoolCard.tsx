"use client";

import { formatEther } from "viem";
import { usePool } from "@/hooks/usePools";
import type { Pool } from "@/lib/contracts";

interface Props {
  poolId:       bigint;
  onContribute?: (_poolId: bigint) => void;
}

export function PoolCard({ poolId, onContribute }: Props) {
  const { data } = usePool(poolId);
  const pool     = data as Pool | undefined;

  if (!pool) return null;

  const deadline = new Date(Number(pool.deadline) * 1000);
  const answered = !!pool.answer;

  return (
    <article className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-tight">{pool.question}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
          answered
            ? "bg-green-400/10 text-green-400"
            : "bg-blue-400/10 text-blue-400"
        }`}>
          {answered ? "Answered" : "Open"}
        </span>
      </div>

      <div className="flex justify-between text-xs text-zinc-500">
        <span>Funded: {formatEther(pool.totalFunded)} CELO</span>
        <span>Closes {deadline.toLocaleDateString()}</span>
      </div>

      {answered && (
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-xs text-zinc-500 mb-1">Answer</p>
          <p className="text-sm">{pool.answer}</p>
        </div>
      )}

      {!answered && onContribute && (
        <button
          type="button"
          onClick={() => onContribute(poolId)}
          className="w-full rounded-lg bg-purple-500/20 py-2 text-sm font-medium text-purple-300 hover:bg-purple-500/30 transition-colors"
        >
          Contribute to this pool
        </button>
      )}
    </article>
  );
}
