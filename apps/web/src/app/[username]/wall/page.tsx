"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Share2, MessageCircle, Flame, Clock, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { useCreatorByUsername, useWallPosts, useHasLiked, useVeildContracts } from "@/hooks/useVeildContracts";
import { formatNumber, timeAgo } from "@/lib/utils";
import { CreatorAvatar } from "@/components/creator/creator-avatar";
import type { Address } from "viem";

function WallSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-16 animate-pulse">
      <div className="border-b border-white/5 h-14" />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white/5 shrink-0" />
          <div className="space-y-2"><div className="h-5 bg-white/5 rounded-full w-32" /><div className="h-3 bg-white/5 rounded-full w-24" /></div>
        </div>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {[0,1,2,3,4].map(i => <div key={i} className="break-inside-avoid bg-[#111] rounded-2xl h-40" />)}
        </div>
      </div>
    </div>
  );
}

function WallPostCard({
  post, index, creatorAddr, creatorName, creatorAvatar,
}: {
  post: { id: bigint; question: string; answer: string; likes: bigint; publishedAt: bigint };
  index: number;
  creatorAddr: Address;
  creatorName: string;
  creatorAvatar: string;
}) {
  const { address } = useAccount();
  const { data: alreadyLiked } = useHasLiked(creatorAddr, BigInt(index), address as Address | undefined);
  const { likeWallPost, isPending } = useVeildContracts();
  const [localLiked, setLocalLiked]   = useState(false);
  const [copied, setCopied]           = useState(false);

  const liked     = alreadyLiked || localLiked;
  const likeCount = post.likes + (localLiked && !alreadyLiked ? 1n : 0n);

  function handleLike() {
    if (liked || !address) return;
    likeWallPost(creatorAddr, BigInt(index));
    setLocalLiked(true);
  }

  function handleShare() {
    const url = `${window.location.origin}/${creatorAddr}/wall#${post.id}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      id={post.id.toString()}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="break-inside-avoid bg-[#111] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all group"
    >
      {/* Question */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <MessageCircle className="w-3 h-3 text-zinc-600" />
          <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">Anonymous asked</span>
        </div>
        <p className="text-zinc-200 text-sm leading-relaxed font-medium">&ldquo;{post.question}&rdquo;</p>
      </div>

      {/* Answer */}
      <div className="border-t border-white/5 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <CreatorAvatar avatarCID={creatorAvatar} name={creatorName} size="xxs" shape="circle" />
          <span className="text-[10px] font-medium text-violet-400">{creatorName.split(" ")[0]} replied</span>
        </div>
        <p className="text-zinc-300 text-sm leading-relaxed">{post.answer}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={handleLike} disabled={liked || !address || isPending}
            aria-label={liked ? "Unlike" : "Like this Q&A"}
            aria-pressed={liked}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              liked ? "text-pink-400" : "text-zinc-600 hover:text-pink-400"
            } disabled:opacity-50`}
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
              <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current scale-110" : ""} transition-all`} />
            )}
            {formatNumber(likeCount)}
          </button>
          <span className="text-zinc-700 text-xs">{timeAgo(post.publishedAt)}</span>
        </div>
        <button onClick={handleShare} aria-label="Share this Q&A" className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
          <Share2 className="w-3.5 h-3.5" />
          {copied ? <span className="text-green-400">Copied!</span> : "Share"}
        </button>
      </div>
    </motion.div>
  );
}

export default function WallPage({ params }: { params: { username: string } }) {
  const { data: creatorResult, isLoading } = useCreatorByUsername(params.username);
  const creatorAddr = creatorResult?.[0] as Address | undefined;
  const creator     = creatorResult?.[1];

  const { data: rawPosts = [], isLoading: loadingPosts } = useWallPosts(creatorAddr);
  const [sortBy, setSortBy] = useState<"top" | "new">("top");

  const posts = [...rawPosts].sort((a, b) =>
    sortBy === "top"
      ? Number(b.likes - a.likes)
      : Number(b.publishedAt - a.publishedAt)
  );

  if (isLoading || loadingPosts) return <WallSkeleton />;
  if (!creator || !creatorAddr || creatorAddr === "0x0000000000000000000000000000000000000000")
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 text-sm mb-4">Creator not found</p>
          <Link href="/" className="text-violet-400 text-sm">← Home</Link>
        </div>
      </div>
    );


  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/${creator.username}`} className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /><span>Profile</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-base">👁️</span>
            <span className="font-bold text-sm tracking-tight">veild</span>
          </Link>
          <Link href={`/${creator.username}`}
            className="text-xs font-medium bg-violet-700 hover:bg-violet-600 transition-colors text-white px-3 py-1.5 rounded-full"
          >
            Send message
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex items-center gap-4 mb-8"
        >
          <CreatorAvatar avatarCID={creator.avatarCID} name={creator.name} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-xl">{creator.name}</h1>
              <span className="text-xs text-zinc-500 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">Wall</span>
            </div>
            <p className="text-zinc-500 text-sm">@{creator.username} · {posts.length} published Q&As</p>
          </div>
        </motion.div>

        {/* SORT */}
        <div className="flex gap-1 mb-6 bg-[#111] border border-white/5 rounded-xl p-1 w-fit">
          {(["top","new"] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                sortBy === s ? "bg-white text-black shadow-sm" : "text-zinc-500"
              }`}
            >
              {s === "top" ? <Flame className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {s === "top" ? "Top" : "New"}
            </button>
          ))}
        </div>

        {/* GRID */}
        {posts.length === 0 ? (
          <div className="text-center py-16 text-zinc-600">
            <MessageCircle className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No published Q&As yet.</p>
            <Link href={`/${creator.username}`} className="text-violet-400 text-xs mt-2 inline-block hover:text-violet-300 transition-colors">
              Send a message →
            </Link>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {posts.map((post, i) => (
              <WallPostCard
                key={post.id.toString()}
                post={post}
                index={i}
                creatorAddr={creatorAddr}
                creatorName={creator.name}
                creatorAvatar={creator.avatarCID}
              />
            ))}
          </div>
        )}

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-zinc-500 text-sm mb-4">Want to ask {creator.name.split(" ")[0]} something?</p>
          <Link href={`/${creator.username}`}
            className="inline-flex items-center gap-2 bg-violet-700 hover:bg-violet-600 transition-all text-white font-semibold px-6 py-3 rounded-full text-sm"
          >
            Send an anonymous message
          </Link>
        </motion.div>
      </div>

      {/* FOOTER */}
      <footer className="mt-16 border-t border-white/5 py-6 text-center">
        <Link href="/" className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-zinc-400 text-xs transition-colors">
          Powered by <span>👁️</span><span className="font-semibold">Veild</span>
        </Link>
      </footer>
    </div>
  );
}
