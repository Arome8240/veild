"use client";

import { memo } from "react";
import Link from "next/link";
import { type Address } from "viem";
import { CreatorAvatar } from "@/components/creator/creator-avatar";
import type { Creator } from "@/lib/contracts";

interface Props {
  creator:  Creator & { address: Address };
  onFollow?: (_address: Address) => void;
  isFollowing?: boolean;
}

export const CreatorCard = memo(function CreatorCard({ creator, onFollow, isFollowing }: Props) {
  return (
    <article className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
      <Link href={`/${creator.username}`} className="shrink-0">
        <CreatorAvatar
          name={creator.name}
          avatarCID={creator.avatarCID}
          size="sm"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/${creator.username}`} className="hover:underline">
          <p className="font-semibold truncate">{creator.name}</p>
          <p className="text-xs text-zinc-500 truncate">@{creator.username}</p>
        </Link>
        {creator.bio && (
          <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{creator.bio}</p>
        )}
      </div>

      {onFollow && (
        <button
          type="button"
          onClick={() => onFollow(creator.address)}
          aria-pressed={isFollowing}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            isFollowing
              ? "border border-white/10 text-zinc-400 hover:bg-white/5"
              : "bg-white text-black hover:bg-white/90"
          }`}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      )}
    </article>
  );
});
