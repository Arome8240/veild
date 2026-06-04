"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, Share2, MessageCircle, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { useHasLiked, useVeildContracts } from "@/hooks/useVeildContracts";
import { useShare } from "@/hooks/useShare";
import { formatNumber, timeAgo } from "@/lib/utils";
import { VEILD_APP_DOMAIN } from "@/constants/config";
import type { WallPost } from "@/types";
import type { Address } from "viem";

interface WallPostCardProps {
  post: WallPost;
  index: number;
  creatorAddr: Address;
  creatorUsername: string;
  creatorName: string;
  creatorAvatar: string;
}

/**
 * Displays a single published Q&A with accessible like and share actions.
 * Extracted from [username]/wall/page.tsx.
 */
export function WallPostCard({
  post,
  index,
  creatorAddr,
  creatorUsername,
  creatorName,
  creatorAvatar,
}: WallPostCardProps) {
  const { address } = useAccount();
  const { data: alreadyLiked } = useHasLiked(
    creatorAddr,
    BigInt(index),
    address as Address | undefined
  );
  const { likeWallPost, isPending } = useVeildContracts();
  const { share, copied } = useShare();

  const [localLiked, setLocalLiked] = useState(false);
  const liked     = alreadyLiked || localLiked;
  const likeCount = post.likes + (localLiked && !alreadyLiked ? 1n : 0n);

  function handleLike() {
    if (liked || !address) return;
    likeWallPost(creatorAddr, BigInt(index));
    setLocalLiked(true);
  }

  function handleShare() {
    share({
      title: `Ask ${creatorName} anything — Veild`,
      url: `https://${VEILD_APP_DOMAIN}/${creatorUsername}/wall#${post.id}`,
    });
  }

  return (
    <article
      id={post.id.toString()}
      aria-label="Published Q&A"
      className="break-inside-avoid bg-card border border-border rounded-2xl p-5 hover:border-border/80 transition-all"
    >
      {/* Question */}
      <section aria-label="Question" className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <MessageCircle className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Anonymous asked
          </span>
        </div>
        <p className="text-foreground text-sm leading-relaxed font-medium">
          &ldquo;{post.question}&rdquo;
        </p>
      </section>

      {/* Answer */}
      <section aria-label="Creator reply" className="border-t border-border pt-4">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="relative w-5 h-5 rounded-full overflow-hidden shrink-0"
            aria-hidden="true"
          >
            <Image src={creatorAvatar} alt="" fill className="object-cover" />
          </div>
          <span className="text-[10px] font-medium text-primary">
            {creatorName.split(" ")[0]} replied
          </span>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">{post.answer}</p>
      </section>

      {/* Footer */}
      <footer className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            disabled={liked || !address || isPending}
            aria-pressed={liked}
            aria-label={liked ? "Unlike" : "Like this Q&A"}
            className={`flex items-center gap-1.5 text-xs transition-colors disabled:opacity-50 ${
              liked
                ? "text-pink-400"
                : "text-muted-foreground hover:text-pink-400"
            }`}
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Heart
                className={`w-3.5 h-3.5 transition-all ${
                  liked ? "fill-current scale-110" : ""
                }`}
                aria-hidden="true"
              />
            )}
            <span aria-live="polite">{formatNumber(likeCount)}</span>
          </button>
          <time
            dateTime={new Date(Number(post.publishedAt) * 1000).toISOString()}
            className="text-muted-foreground/60 text-xs"
          >
            {timeAgo(post.publishedAt)}
          </time>
        </div>

        <button
          onClick={handleShare}
          aria-label="Share this Q&A"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span aria-live="polite">{copied ? "Copied!" : "Share"}</span>
        </button>
      </footer>
    </article>
  );
}
