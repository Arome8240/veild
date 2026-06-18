"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Copy, Check, Share2, MessageCircle,
  Bell, ChevronRight, ExternalLink, Loader2,
} from "lucide-react";
import { useCurrentCreator } from "@/hooks/useCurrentCreator";
import { useMiniPay } from "@/hooks/useMiniPay";
import { CreatorSearch } from "@/components/creator/creator-search";
import { CreatorAvatar } from "@/components/creator/creator-avatar";
import { BottomNav } from "@/components/bottom-nav";
import { formatCELO, formatNumber, timeAgo } from "@/lib/utils";

export default function HomePage() {
  const { address, isConnected, connectWallet, isConnecting } = useMiniPay();
  const {
    profile, stats, earnings, wallPosts, isLoading, isRegistered,
  } = useCurrentCreator();

  const [copied, setCopied] = useState(false);

  const profileUrl = profile?.username
    ? `veild.vercel.app/${profile.username}`
    : address
    ? `veild.vercel.app/0x${address.slice(2, 8).toLowerCase()}`
    : "veild.vercel.app/your-link";

  const copyLink = useCallback(() => {
    if (navigator.clipboard && profile?.username)
      navigator.clipboard.writeText(`https://veild.vercel.app/${profile.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [profile?.username]);

  const shareLink = useCallback(async () => {
    const shareData = {
      title: `Ask ${profile?.name ?? "me"} anything — anonymously`,
      text: "Send me an anonymous message on Veild.",
      url: `https://${profileUrl}`,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); return; } catch {}
    }
    copyLink();
  }, [profile?.name, profileUrl, copyLink]);

  const unread = stats ? Number(stats.unread) : 0;

  // ── Not connected ────────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white pb-24 flex flex-col items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="text-5xl mb-4">👁️</div>
          <h1 className="font-bold text-xl mb-2">Welcome to Veild</h1>
          <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
            Connect your wallet or open in MiniPay to access your creator inbox.
          </p>
          <button type="button" onClick={connectWallet} disabled={isConnecting}
            className="flex items-center justify-center gap-2 bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold px-6 py-3 rounded-full transition-all disabled:opacity-60 mx-auto"
          >
            {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isConnecting ? "Connecting…" : "Connect Wallet"}
          </button>
        </motion.div>
        <BottomNav />
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pb-24 animate-pulse">
        <div className="border-b border-white/5 h-14" />
        <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
          <div className="bg-[#111] rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/5 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 bg-white/5 rounded-full w-28" />
                <div className="h-2.5 bg-white/5 rounded-full w-20" />
              </div>
            </div>
            <div className="h-8 bg-white/4 rounded-xl" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0,1,2].map(i => <div key={i} className="bg-[#111] rounded-xl h-14" />)}
          </div>
          {[0,1,2].map(i => <div key={i} className="bg-[#111] rounded-2xl h-28" />)}
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Not registered ───────────────────────────────────────────────────────────
  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white pb-24 flex flex-col items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="text-5xl mb-4">✨</div>
          <h1 className="font-bold text-xl mb-2">Set up your Veild</h1>
          <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
            Register as a creator to get your personal link and start receiving anonymous messages.
          </p>
          <Link href="/profile"
            className="inline-flex items-center gap-2 bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold px-6 py-3 rounded-full transition-all"
          >
            Create your profile →
          </Link>
        </motion.div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
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
                  {unread > 9 ? "9+" : unread}
                </span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4">
        {/* CREATOR CARD */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="mt-4 mb-4 bg-[#111] border border-white/5 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <CreatorAvatar
              avatarCID={profile?.avatarCID}
              name={profile?.name ?? "You"}
              size="md"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-sm leading-tight">{profile?.name ?? "Creator"}</p>
                {profile?.isVerified && (
                  <span className="text-[9px] font-semibold text-violet-300 bg-violet-500/15 border border-violet-500/25 px-1.5 py-0.5 rounded-full">✓</span>
                )}
              </div>
              <p className="text-zinc-500 text-xs">@{profile?.username}</p>
            </div>
            <Link href={`/${profile?.username}`}
              className="ml-auto flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 border border-violet-500/25 px-2.5 py-1 rounded-full transition-colors"
            >
              Preview <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>

          {/* Share link */}
          <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/8 rounded-xl px-3 py-2.5 mb-3">
            <span className="text-zinc-500 text-xs font-mono flex-1 truncate">{profileUrl}</span>
            <button type="button" onClick={copyLink}
              className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg transition-all ${
                copied ? "bg-green-500/15 text-green-400" : "bg-violet-600 hover:bg-violet-500 text-white"
              }`}
            >
              {copied ? <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span>
                : <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</span>}
            </button>
          </div>

          <button type="button" onClick={shareLink}
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/8 border border-white/8 text-zinc-300 text-xs font-medium py-2.5 rounded-xl transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" /> Share your Veild link
          </button>
        </motion.div>

        {/* SEARCH */}
        <CreatorSearch />

        {/* STATS */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}
          className="grid grid-cols-3 gap-2 mb-6"
        >
          {[
            { value: stats ? formatNumber(stats.total) : "0", label: "messages" },
            { value: earnings > 0n ? `${formatCELO(earnings)} CELO` : "0 CELO", label: "earned", green: true },
            { value: stats ? `${stats.unread}` : "0", label: "unread" },
          ].map((s, i) => (
            <div key={i} className="bg-[#111] border border-white/5 rounded-xl p-3 text-center">
              <p className={`font-bold text-base leading-none mb-0.5 ${s.green ? "text-green-400" : ""}`}>{s.value}</p>
              <p className="text-zinc-600 text-[10px]">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* UNREAD BANNER */}
        {unread > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 }} className="mb-5">
            <Link href="/inbox"
              className="flex items-center justify-between bg-violet-600/15 border border-violet-500/25 rounded-xl px-4 py-3 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{unread}</div>
                <p className="text-sm font-medium text-violet-100">
                  {unread} new {unread === 1 ? "message" : "messages"} waiting
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-violet-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>
        )}

        {/* WALL FEED */}
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Your wall</h2>
          {profile?.username && (
            <Link href={`/${profile.username}/wall`}
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-0.5 transition-colors"
            >
              See all <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {wallPosts.length === 0 ? (
          <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center">
            <MessageCircle className="w-6 h-6 mx-auto mb-2 text-zinc-700" />
            <p className="text-zinc-600 text-sm">No published Q&As yet.</p>
            <p className="text-zinc-700 text-xs mt-1">Reply to messages and publish them to fill your wall.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wallPosts.map((post, i) => (
              <motion.div key={post.id.toString()}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.07, duration: 0.35 }}
                className="bg-[#111] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors"
              >
                <div className="flex items-start gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-medium text-zinc-500 shrink-0 mt-0.5">?</div>
                  <p className="text-zinc-300 text-sm leading-relaxed">{post.question}</p>
                </div>
                <div className="flex items-start gap-2 pl-1 border-l-2 border-violet-500/30 ml-3">
                  <div className="mt-0.5">
                    <CreatorAvatar
                      avatarCID={profile?.avatarCID}
                      name={profile?.name ?? "You"}
                      size="xxs"
                      shape="circle"
                    />
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{post.answer}</p>
                </div>
                <div className="flex items-center gap-3 mt-3 ml-0.5">
                  <span className="flex items-center gap-1 text-xs text-zinc-600">
                    ❤ {formatNumber(post.likes)}
                  </span>
                  <span className="text-zinc-700 text-xs">{timeAgo(post.publishedAt)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
