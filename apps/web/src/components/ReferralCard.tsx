"use client";

import { formatEther, type Address } from "viem";
import { useReferrerStats } from "@/hooks/useReferral";
import { VEILD_APP_DOMAIN } from "@/constants/config";
import type { ReferrerStats } from "@/lib/contracts";

interface Props {
  referrer: Address;
  onClaim:  () => void;
}

export function ReferralCard({ referrer, onClaim }: Props) {
  const { data } = useReferrerStats(referrer);
  const stats    = data as ReferrerStats | undefined;

  const count   = stats?.totalReferrals ?? 0n;
  const pending = stats?.pendingReward ?? 0n;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
      <h3 className="font-semibold">Referrals</h3>

      <div className="grid grid-cols-2 gap-3 text-center" role="list" aria-label="Referral statistics">
        <div className="rounded-lg bg-white/5 p-3" role="listitem" aria-label={`Total referred: ${count.toString()}`}>
          <p className="text-xs text-zinc-500" aria-hidden="true">Total Referred</p>
          <p className="text-2xl font-bold" aria-hidden="true">{count.toString()}</p>
        </div>
        <div className="rounded-lg bg-white/5 p-3" role="listitem" aria-label={`Pending reward: ${formatEther(pending)} CELO`}>
          <p className="text-xs text-zinc-500" aria-hidden="true">Pending Reward</p>
          <p className="font-bold" aria-hidden="true">{formatEther(pending)} CELO</p>
        </div>
      </div>

      {pending > 0n && (
        <button
          type="button"
          onClick={onClaim}
          className="w-full rounded-lg bg-yellow-500/20 py-2 text-sm font-medium text-yellow-300 hover:bg-yellow-500/30 transition-colors"
        >
          Claim {formatEther(pending)} CELO
        </button>
      )}

      <div className="rounded-lg bg-white/5 p-3 text-center">
        <p className="text-xs text-zinc-500 mb-1">Your referral link</p>
        <p className="font-mono text-xs text-zinc-300 truncate">
          {VEILD_APP_DOMAIN}/r/{referrer.slice(0, 10)}…
        </p>
      </div>
    </div>
  );
}
