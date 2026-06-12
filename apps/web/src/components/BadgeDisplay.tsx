"use client";

import { type Address } from "viem";
import { useCreatorBadges } from "@/hooks/useBadgesExtended";
import type { BadgeBitmap } from "@/lib/contracts";

const BADGE_META: Array<{ key: keyof BadgeBitmap; label: string; emoji: string }> = [
  { key: "firstMessage",    label: "First Message",    emoji: "💬" },
  { key: "risingStar",      label: "Rising Star",      emoji: "⭐" },
  { key: "verifiedCreator", label: "Verified Creator", emoji: "✅" },
  { key: "firstTip",        label: "First Tip",        emoji: "💸" },
  { key: "topTipper",       label: "Top Tipper",       emoji: "💎" },
  { key: "subscriber",      label: "Subscriber",       emoji: "🔔" },
  { key: "poolCreator",     label: "Pool Creator",     emoji: "🏛️" },
  { key: "poolAnswerer",    label: "Pool Answerer",    emoji: "🎯" },
];

interface Props {
  creator: Address;
}

export function BadgeDisplay({ creator }: Props) {
  const { data: bitmap } = useCreatorBadges(creator);

  if (!bitmap) return null;

  const earned = BADGE_META.filter(({ key }) => bitmap[key]);

  if (earned.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5" role="list" aria-label="Creator badges">
      {earned.map(({ key, label, emoji }) => (
        <span
          key={key}
          role="listitem"
          title={label}
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs"
        >
          <span aria-hidden="true">{emoji}</span>
          <span>{label}</span>
        </span>
      ))}
    </div>
  );
}
