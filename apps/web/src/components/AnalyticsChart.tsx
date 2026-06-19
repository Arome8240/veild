"use client";

import { formatEther, type Address } from "viem";
import { useCreatorAnalytics } from "@/hooks/useCreatorAnalytics";

interface Props {
  creator: Address;
}

export function AnalyticsChart({ creator }: Props) {
  const a = useCreatorAnalytics(creator);

  if (a.isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 animate-pulse">
        <div className="h-4 w-24 rounded bg-white/10 mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  const d = a.data;
  const stats = [
    { label: "Tips",         value: formatEther(d?.tipEarnings ?? 0n),     unit: "CELO" },
    { label: "Subs",         value: formatEther(d?.subEarnings ?? 0n),     unit: "CELO" },
    { label: "Gifts",        value: formatEther(d?.giftEarnings ?? 0n),    unit: "CELO" },
    { label: "Total",        value: formatEther(d?.totalEarnings ?? 0n),   unit: "CELO" },
    { label: "Tip count",    value: (d?.tipCount ?? 0n).toString(),        unit: "txns" },
    { label: "Subscribers",  value: (d?.subscriberCount ?? 0n).toString(), unit: "" },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <h3 className="font-semibold" id="analytics-heading">Analytics</h3>
      <div
        className="grid grid-cols-3 gap-2"
        role="list"
        aria-labelledby="analytics-heading"
      >
        {stats.map((s) => (
          <div
            key={s.label}
            role="listitem"
            aria-label={`${s.label}: ${s.value}${s.unit ? " " + s.unit : ""}`}
            className="rounded-lg bg-white/5 p-3 text-center"
          >
            <p className="text-xs text-zinc-500" aria-hidden="true">{s.label}</p>
            <p className="font-bold text-sm truncate" aria-hidden="true">{s.value}</p>
            {s.unit && <p className="text-xs text-zinc-600" aria-hidden="true">{s.unit}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
