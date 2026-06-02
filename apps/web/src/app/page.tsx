"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  Share2,
  MessageCircle,
  Heart,
  DollarSign,
  Bell,
  ChevronRight,
  Zap,
  ExternalLink,
} from "lucide-react";
import {
  mockCreators,
  getCreatorWallPosts,
  getCreatorStats,
} from "@/lib/mockData";
import { BottomNav } from "@/components/bottom-nav";

const ME = mockCreators[0];
const profileUrl = `veild.app/${ME.username}`;

function timeAgo(date: Date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function formatNum(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

export default function HomePage() {
  const stats = getCreatorStats(ME.id);
  const wallPosts = getCreatorWallPosts(ME.id);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const unread = stats.unread;

  function copyLink() {
    if (navigator.clipboard) navigator.clipboard.writeText(`https://${profileUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareLink() {
    const shareData = {
      title: `Send ${ME.name} an anonymous message`,
      text: "Ask me anything — I can't see who you are.",
      url: `https://${profileUrl}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled or API unavailable
      }
    }
    copyLink();
  }

  function toggleLike(id: string) {
    setLiked((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* STATUS BAR SPACER */}
      <div className="h-safe-top" />

      {/* TOP BAR */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-base tracking-tight flex items-center gap-1.5">
            <span>👁️</span> veild
          </span>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <Link href="/inbox" className="relative">
                <Bell className="w-5 h-5 text-zinc-400" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-600 rounded-full text-[9px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4">
        {/* CREATOR CARD */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-4 mb-4 bg-[#111] border border-white/5 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 ring-2 ring-white/5">
              <Image src={ME.avatar} alt={ME.name} fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-sm leading-tight">{ME.name}</p>
                {ME.isVerified && (
                  <span className="text-[9px] font-semibold text-violet-300 bg-violet-500/15 border border-violet-500/25 px-1.5 py-0.5 rounded-full">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-zinc-500 text-xs">@{ME.username}</p>
            </div>
            <Link
              href={`/${ME.username}`}
              className="ml-auto flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 border border-violet-500/25 px-2.5 py-1 rounded-full transition-colors"
            >
              Preview <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>

          {/* Share link row */}
          <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/8 rounded-xl px-3 py-2.5 mb-3">
            <span className="text-zinc-500 text-xs font-mono flex-1 truncate">
              {profileUrl}
            </span>
            <button
              onClick={copyLink}
              className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg transition-all ${
                copied
                  ? "bg-green-500/15 text-green-400"
                  : "bg-violet-600 hover:bg-violet-500 text-white"
              }`}
            >
              {copied ? (
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3" /> Copied
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Copy className="w-3 h-3" /> Copy
                </span>
              )}
            </button>
          </div>

          <button
            onClick={shareLink}
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/8 border border-white/8 text-zinc-300 text-xs font-medium py-2.5 rounded-xl transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share your Veild link
          </button>
        </motion.div>

        {/* STATS ROW */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="grid grid-cols-3 gap-2 mb-6"
        >
          {[
            { icon: MessageCircle, value: formatNum(stats.totalMessages), label: "messages", color: "violet" },
            { icon: DollarSign, value: `$${ME.earnings.toFixed(0)}`, label: "earned", color: "green" },
            { icon: Zap, value: `${stats.replyRate}%`, label: "reply rate", color: "amber" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[#111] border border-white/5 rounded-xl p-3 text-center"
            >
              <p className="font-bold text-base leading-none mb-0.5">{s.value}</p>
              <p className="text-zinc-600 text-[10px]">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* UNREAD BANNER */}
        {unread > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12 }}
            className="mb-5"
          >
            <Link
              href="/inbox"
              className="flex items-center justify-between bg-violet-600/15 border border-violet-500/25 rounded-xl px-4 py-3 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                  {unread}
                </div>
                <p className="text-sm font-medium text-violet-100">
                  {unread} new{" "}
                  {unread === 1 ? "message" : "messages"} waiting
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-violet-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>
        )}

        {/* WALL FEED */}
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Your wall
          </h2>
          <Link
            href={`/${ME.username}/wall`}
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-0.5 transition-colors"
          >
            See all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-3">
          {wallPosts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07, duration: 0.35 }}
              className="bg-[#111] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors"
            >
              {/* Question */}
              <div className="flex items-start gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-medium text-zinc-500 shrink-0 mt-0.5">
                  ?
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  {post.question}
                </p>
              </div>

              {/* Answer */}
              <div className="flex items-start gap-2 pl-1 border-l-2 border-violet-500/30 ml-3">
                <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0 mt-0.5">
                  <Image src={ME.avatar} alt={ME.name} fill className="object-cover" />
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {post.answer}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 mt-3 ml-0.5">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-1 text-xs transition-colors ${
                    liked.has(post.id) ? "text-pink-400" : "text-zinc-600 hover:text-pink-400"
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${liked.has(post.id) ? "fill-current" : ""}`}
                  />
                  {formatNum(post.likes + (liked.has(post.id) ? 1 : 0))}
                </button>
                <span className="text-zinc-700 text-xs">{timeAgo(post.timestamp)} ago</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
