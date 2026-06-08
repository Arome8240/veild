"use client";

import { Medal, Trophy } from "lucide-react";
import { type Address } from "viem";
import { useTipLeaderboard, useTotalTipped } from "@/hooks/useTips";
import { formatCELO, truncateAddress } from "@/lib/utils";

interface TipLeaderboardProps {
  creatorAddress: Address;
}

const MEDAL_COLORS = ["text-amber-400", "text-slate-400", "text-orange-500"] as const;

export function TipLeaderboard({ creatorAddress }: TipLeaderboardProps) {
  const { data: leaderboard = [], isLoading } = useTipLeaderboard(creatorAddress);
  const { data: totalTipped = 0n }            = useTotalTipped(creatorAddress);

  if (!isLoading && leaderboard.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <h3 className="text-sm font-semibold">Top supporters</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatCELO(totalTipped)} CELO total
        </span>
      </div>

      {isLoading ? (
        <div className="divide-y divide-border animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className="w-6 h-6 bg-muted rounded-full" />
              <div className="flex-1 h-3 bg-muted rounded" />
              <div className="w-16 h-3 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-border" aria-label="Top tip supporters">
          {leaderboard.map((entry, i) => (
            <li key={entry.fan} className="px-4 py-3 flex items-center gap-3">
              <span
                className={`w-5 text-center text-xs font-bold shrink-0 ${
                  i < 3 ? MEDAL_COLORS[i] : "text-muted-foreground"
                }`}
                aria-label={`Rank ${i + 1}`}
              >
                {i < 3 ? <Medal className="w-4 h-4 inline" aria-hidden="true" /> : i + 1}
              </span>
              <span className="flex-1 text-xs font-mono text-muted-foreground truncate">
                {truncateAddress(entry.fan)}
              </span>
              <span className="text-xs font-semibold text-foreground shrink-0">
                {formatCELO(entry.totalTipped)} CELO
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
