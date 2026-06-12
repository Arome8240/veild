"use client";

import { useState, useCallback } from "react";

const REACTIONS = ["❤️", "🔥", "😂", "👏", "😮"] as const;
type Emoji = (typeof REACTIONS)[number];

interface ReactionCount {
  emoji: Emoji;
  count: number;
  reacted: boolean;
}

interface Props {
  messageId: string;
  initial?:  Partial<Record<Emoji, number>>;
}

export function MessageReactions({ messageId: _id, initial = {} }: Props) {
  const [reactions, setReactions] = useState<ReactionCount[]>(() =>
    REACTIONS.map((emoji) => ({
      emoji,
      count: initial[emoji] ?? 0,
      reacted: false,
    }))
  );

  const toggle = useCallback((emoji: Emoji) => {
    setReactions((prev) =>
      prev.map((r) =>
        r.emoji !== emoji
          ? r
          : {
              ...r,
              reacted: !r.reacted,
              count: r.reacted ? r.count - 1 : r.count + 1,
            }
      )
    );
  }, []);

  const visible = reactions.filter((r) => r.count > 0 || true);

  return (
    <div className="flex flex-wrap gap-1 mt-1.5" role="group" aria-label="Message reactions">
      {visible.map((r) => (
        <button
          key={r.emoji}
          onClick={() => toggle(r.emoji)}
          aria-pressed={r.reacted}
          aria-label={`React with ${r.emoji}: ${r.count}`}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors ${
            r.reacted
              ? "bg-white/15 text-white"
              : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
          }`}
        >
          <span>{r.emoji}</span>
          {r.count > 0 && <span className="tabular-nums">{r.count}</span>}
        </button>
      ))}
    </div>
  );
}
