"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Share2, MessageCircle } from "lucide-react";
import { getCreatorByUsername, getCreatorWallPosts, mockCreators } from "@/lib/mockData";
import { useState } from "react";

function formatNumber(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

function timeAgo(date: Date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function WallPage({
  params,
}: {
  params: { username: string };
}) {
  const creator = getCreatorByUsername(params.username) ?? mockCreators[0];
  const posts = getCreatorWallPosts(creator.id);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  function toggleLike(id: string) {
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleShare(postId: string) {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/${creator.username}/wall#${postId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopied(postId);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={`/${creator.username}`}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Profile</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-base">👁️</span>
            <span className="font-bold text-sm tracking-tight">veild</span>
          </Link>
          <Link
            href={`/${creator.username}`}
            className="text-xs font-medium bg-violet-700 hover:bg-violet-600 transition-colors text-white px-3 py-1.5 rounded-full"
          >
            Send message
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* PAGE HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4 mb-10"
        >
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-[#1a1a1a] ring-2 ring-white/5 shrink-0">
            <Image
              src={creator.avatar}
              alt={creator.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-xl">{creator.name}</h1>
              <span className="text-xs text-zinc-500 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">
                Wall
              </span>
            </div>
            <p className="text-zinc-500 text-sm">
              @{creator.username} · {posts.length} published Q&As
            </p>
          </div>
        </motion.div>

        {/* GRID */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              id={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              className="break-inside-avoid bg-[#111] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all group"
            >
              {/* Question */}
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <MessageCircle className="w-3 h-3 text-zinc-600" />
                  <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
                    Anonymous asked
                  </span>
                </div>
                <p className="text-zinc-200 text-sm leading-relaxed font-medium">
                  &ldquo;{post.question}&rdquo;
                </p>
              </div>

              {/* Answer */}
              <div className="border-t border-white/5 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative w-5 h-5 rounded-full overflow-hidden bg-[#1a1a1a] shrink-0">
                    <Image
                      src={creator.avatar}
                      alt={creator.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-[10px] font-medium text-violet-400">
                    {creator.name.split(" ")[0]} replied
                  </span>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  {post.answer}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1.5 text-xs transition-colors group/like ${
                      liked.has(post.id)
                        ? "text-pink-400"
                        : "text-zinc-600 hover:text-pink-400"
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-all ${
                        liked.has(post.id) ? "fill-current scale-110" : ""
                      }`}
                    />
                    {formatNumber(post.likes + (liked.has(post.id) ? 1 : 0))}
                  </button>
                  <span className="text-zinc-700 text-xs">
                    {timeAgo(post.timestamp)}
                  </span>
                </div>
                <button
                  onClick={() => handleShare(post.id)}
                  className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {copied === post.id ? (
                    <span className="text-green-400">Copied!</span>
                  ) : (
                    "Share"
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-zinc-500 text-sm mb-4">
            Want to ask {creator.name.split(" ")[0]} something?
          </p>
          <Link
            href={`/${creator.username}`}
            className="inline-flex items-center gap-2 bg-violet-700 hover:bg-violet-600 transition-all text-white font-semibold px-6 py-3 rounded-full text-sm"
          >
            Send an anonymous message
          </Link>
        </motion.div>
      </div>

      {/* FOOTER */}
      <footer className="mt-16 border-t border-white/5 py-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-zinc-400 text-xs transition-colors"
        >
          Powered by <span>👁️</span>
          <span className="font-semibold">Veild</span>
        </Link>
      </footer>
    </div>
  );
}
