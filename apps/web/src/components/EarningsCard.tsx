"use client";

import { formatEther, type Address } from "viem";
import { useCreatorAnalytics } from "@/hooks/useCreatorAnalytics";

interface Props {
  creator:          Address;
  onClaimTips?:     () => void;
  onClaimSubs?:     () => void;
  onClaimGifts?:    () => void;
  claimPending?:    boolean;
}

export function EarningsCard({ creator, onClaimTips, onClaimSubs, onClaimGifts, claimPending }: Props) {
  const a = useCreatorAnalytics(creator);
  const d = a.data;

  const rows = [
    { label: "Tips",          value: d?.tipEarnings  ?? 0n, onClaim: onClaimTips  },
    { label: "Subscriptions", value: d?.subEarnings  ?? 0n, onClaim: onClaimSubs  },
    { label: "Gifts",         value: d?.giftEarnings ?? 0n, onClaim: onClaimGifts },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Earnings</h3>
        <span className="text-xs text-zinc-500">
          Total: {formatEther(d?.totalEarnings ?? 0n)} CELO
        </span>
      </div>

      <div className="divide-y divide-white/5">
        {rows.map(({ label, value, onClaim }) => (
          <div key={label} className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-zinc-500">{formatEther(value)} CELO</p>
            </div>
            {onClaim && value > 0n && (
              <button
                type="button"
                onClick={onClaim}
                disabled={claimPending}
                className="rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-300 hover:bg-green-500/30 disabled:opacity-40 transition-colors"
              >
                Claim
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
