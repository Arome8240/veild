"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  Share2,
  ExternalLink,
  MessageCircle,
  DollarSign,
  TrendingUp,
  Users,
  Eye,
  ChevronRight,
} from "lucide-react";
import { mockCreators, getCreatorStats, getCreatorWallPosts } from "@/lib/mockData";
import { BottomNav } from "@/components/bottom-nav";

const ME = mockCreators[0];

function formatNum(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

const OTHER_CREATORS = mockCreators.slice(1);

export default function ProfilePage() {
  const stats = getCreatorStats(ME.id);
  const wallPosts = getCreatorWallPosts(ME.id);
  const [copied, setCopied] = useState(false);

  const profileUrl = `veild.app/${ME.username}`;

  function copyLink() {
    if (navigator.clipboard) navigator.clipboard.writeText(`https://${profileUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold text-base">Profile</h1>
          <Link
            href={`/${ME.username}`}
            className="flex items-center gap-1 text-xs text-violet-400 border border-violet-500/25 px-2.5 py-1 rounded-full hover:border-violet-400/40 transition-colors"
          >
            Fan view <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">
        {/* PROFILE CARD */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden"
        >
          {/* Cover gradient */}
          <div className="h-20 bg-gradient-to-br from-violet-900/60 via-purple-900/30 to-[#111]" />

          <div className="px-4 pb-4 -mt-8">
            <div className="flex items-end justify-between mb-3">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-[#111] shrink-0">
                <Image src={ME.avatar} alt={ME.name} fill className="object-cover" />
              </div>
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 text-xs font-medium bg-violet-700 hover:bg-violet-600 text-white px-3 py-1.5 rounded-full transition-colors mb-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy link
                  </>
                )}
              </button>
            </div>

            <h2 className="font-bold text-base leading-tight">{ME.name}</h2>
            <p className="text-zinc-500 text-xs mb-2">@{ME.username}</p>
            <p className="text-zinc-400 text-sm leading-relaxed mb-3">{ME.bio}</p>

            <div className="flex items-center gap-1 bg-[#0a0a0a] border border-white/6 rounded-xl px-3 py-2">
              <span className="text-zinc-500 text-xs font-mono flex-1 truncate">
                {profileUrl}
              </span>
              <Share2 className="w-3.5 h-3.5 text-zinc-600" />
            </div>
          </div>
        </motion.div>

        {/* STATS GRID */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
          className="grid grid-cols-2 gap-2"
        >
          {[
            {
              icon: MessageCircle,
              label: "Messages",
              value: formatNum(stats.totalMessages),
              sub: "received",
              color: "text-violet-400",
              bg: "bg-violet-500/8",
            },
            {
              icon: DollarSign,
              label: "Earned",
              value: `$${ME.earnings.toFixed(2)}`,
              sub: "from priority",
              color: "text-green-400",
              bg: "bg-green-500/8",
            },
            {
              icon: TrendingUp,
              label: "Reply rate",
              value: `${stats.replyRate}%`,
              sub: "last 30 days",
              color: "text-amber-400",
              bg: "bg-amber-400/8",
            },
            {
              icon: Users,
              label: "Followers",
              value: formatNum(ME.followers),
              sub: "on platform",
              color: "text-blue-400",
              bg: "bg-blue-500/8",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[#111] border border-white/5 rounded-2xl p-4"
            >
              <div className={`w-8 h-8 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="font-bold text-base leading-none">{s.value}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{s.label}</p>
              <p className="text-zinc-700 text-[10px]">{s.sub}</p>
            </div>
          ))}
        </motion.div>

        {/* WALL PREVIEW */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-semibold">Your wall</span>
              <span className="text-xs text-zinc-600 bg-white/5 px-2 py-0.5 rounded-full">
                {wallPosts.length} published
              </span>
            </div>
            <Link
              href={`/${ME.username}/wall`}
              className="text-xs text-violet-400 flex items-center gap-0.5"
            >
              View <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-white/4">
            {wallPosts.slice(0, 3).map((p) => (
              <div key={p.id} className="px-4 py-3">
                <p className="text-zinc-400 text-xs leading-relaxed line-clamp-1 mb-1">
                  Q: {p.question}
                </p>
                <p className="text-zinc-200 text-xs leading-relaxed line-clamp-1">
                  A: {p.answer}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* OTHER CREATORS */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
        >
          <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3 font-medium">
            Other creators
          </p>
          <div className="space-y-2">
            {OTHER_CREATORS.map((c) => (
              <Link
                key={c.id}
                href={`/${c.username}`}
                className="flex items-center gap-3 bg-[#111] border border-white/5 rounded-xl p-3 hover:border-white/10 transition-colors group"
              >
                <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0">
                  <Image src={c.avatar} alt={c.name} fill className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm leading-tight">{c.name}</p>
                  <p className="text-zinc-500 text-xs truncate">@{c.username}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
