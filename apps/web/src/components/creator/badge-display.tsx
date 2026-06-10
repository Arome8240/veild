"use client";

import { type Address } from "viem";
import { useBadgeBitmap } from "@/hooks/useBadges";

const BADGE_META = [
  { emoji: "✉️",  label: "First Message",    desc: "Received their first message" },
  { emoji: "⭐",  label: "Rising Star",       desc: "Crossed 100 messages" },
  { emoji: "✅",  label: "Verified Creator",  desc: "Verified by the platform" },
  { emoji: "💸",  label: "First Tip",         desc: "Received their first tip" },
  { emoji: "🏆",  label: "Top Tipper",        desc: "Tipped over 1 CELO total" },
  { emoji: "🔔",  label: "Subscriber",        desc: "Holds an active subscription" },
  { emoji: "🌊",  label: "Pool Creator",      desc: "Opened their first question pool" },
  { emoji: "💡",  label: "Pool Answerer",     desc: "Answered a funded pool question" },
] as const;

interface BadgeDisplayProps {
  holderAddress: Address;
  /** When true show all 8 slots (greyed out if not earned). Default: only show earned. */
  showAll?: boolean;
}

export function BadgeDisplay({ holderAddress, showAll = false }: BadgeDisplayProps) {
  const { data: bitmap, isLoading } = useBadgeBitmap(holderAddress);

  if (isLoading) {
    return (
      <div className="flex gap-1.5 flex-wrap" aria-label="Loading badges…">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-7 h-7 rounded-full bg-muted animate-pulse" aria-hidden="true" />
        ))}
      </div>
    );
  }

  const entries = BADGE_META.map((meta, i) => ({
    ...meta,
    earned: bitmap?.[i] ?? false,
    id: i,
  }));

  const visible = showAll ? entries : entries.filter((e) => e.earned);

  if (visible.length === 0) return null;

  return (
    <div className="flex gap-1.5 flex-wrap" role="list" aria-label="Achievement badges">
      {visible.map((badge) => (
        <div
          key={badge.id}
          role="listitem"
          title={`${badge.label}: ${badge.desc}`}
          aria-label={badge.earned ? badge.label : `${badge.label} (not earned)`}
          className={`relative group w-7 h-7 rounded-full flex items-center justify-center text-sm select-none cursor-default transition-all ${
            badge.earned
              ? "bg-primary/15 border border-primary/30 shadow-sm"
              : "bg-muted border border-border opacity-30"
          }`}
        >
          <span aria-hidden="true">{badge.emoji}</span>

          {/* Tooltip */}
          <div
            className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 whitespace-nowrap px-2 py-1 rounded-lg bg-popover border border-border text-popover-foreground text-[10px] leading-tight shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            role="tooltip"
          >
            <p className="font-semibold">{badge.label}</p>
            <p className="text-muted-foreground">{badge.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
