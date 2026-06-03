"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Reply, Eye, Archive, X, Check,
  MessageCircle, ChevronDown, Search, Loader2,
} from "lucide-react";
import { useAccount } from "wagmi";
import {
  useInbox, useInboxStats, useEarnings, useVeildContracts,
} from "@/hooks/useVeildContracts";
import { useCurrentCreator } from "@/hooks/useCurrentCreator";
import { BottomNav } from "@/components/bottom-nav";
import { formatCELO, formatNumber, timeAgo, resolveAvatar } from "@/lib/utils";
import type { Address } from "viem";
import type { Message } from "veild-sdk";

type Tab = "all" | "priority" | "unanswered";

// ─── Reply Sheet ──────────────────────────────────────────────────────────────
function ReplySheet({
  message, msgIndex, onClose,
}: {
  message: Message; msgIndex: number; onClose: () => void;
}) {
  const [reply, setReply]         = useState("");
  const [publishToWall, setPub]   = useState(false);
  const { replyToMessage, isPending, isConfirming, isConfirmed, reset } = useVeildContracts();

  function handleSubmit() {
    if (!reply.trim()) return;
    replyToMessage(BigInt(msgIndex), reply, publishToWall);
  }

  if (isConfirmed) {
    setTimeout(() => { reset(); onClose(); }, 800);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full bg-[#141414] border-t border-white/10 rounded-t-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto"
      >
        <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Reply on-chain</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white/4 border border-white/6 rounded-xl px-3.5 py-3 mb-4">
          <p className="text-[10px] text-zinc-500 mb-1">Anonymous asked</p>
          <p className="text-zinc-200 text-sm leading-relaxed line-clamp-3">&ldquo;{message.content}&rdquo;</p>
        </div>

        <textarea value={reply} onChange={e => setReply(e.target.value)}
          placeholder="Your reply…" rows={4} autoFocus
          className="w-full bg-[#1c1c1c] border border-white/8 focus:border-violet-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 resize-none outline-none transition-colors leading-relaxed mb-3"
        />

        {/* Publish toggle */}
        <button onClick={() => setPub(!publishToWall)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm mb-4 transition-all ${
            publishToWall ? "bg-green-500/10 border-green-500/25 text-green-300" : "bg-white/3 border-white/8 text-zinc-400"
          }`}
        >
          <div className="flex items-center gap-2 text-xs">
            <Eye className="w-3.5 h-3.5" />Publish to wall
          </div>
          <div className={`w-9 h-5 rounded-full transition-colors relative ${publishToWall ? "bg-green-500" : "bg-white/10"}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${publishToWall ? "left-[18px]" : "left-0.5"}`} />
          </div>
        </button>

        <button onClick={handleSubmit} disabled={!reply.trim() || isPending || isConfirming || isConfirmed}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all ${
            isConfirmed ? "bg-green-500/15 border border-green-500/25 text-green-300"
            : reply.trim() && !isPending && !isConfirming ? "bg-violet-700 hover:bg-violet-600 text-white"
            : "bg-white/5 text-zinc-600 cursor-not-allowed"
          }`}
        >
          {isConfirmed ? <><Check className="w-4 h-4" /> Confirmed!</>
          : isPending || isConfirming ? <><Loader2 className="w-4 h-4 animate-spin" /> {isPending ? "Confirm in wallet…" : "Confirming…"}</>
          : <><Reply className="w-4 h-4" /> Send Reply</>}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Message Card ─────────────────────────────────────────────────────────────
function MessageCard({
  message, msgIndex, creatorAvatar, creatorName, onReply,
}: {
  message: Message; msgIndex: number;
  creatorAvatar: string; creatorName: string;
  onReply: (m: Message, i: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { archiveMessage, publishToWall, isPending, isConfirming } = useVeildContracts();
  const isLong = message.content.length > 120;

  if (message.isArchived) return null;

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.18 } }}
      className={`relative bg-[#111] border rounded-2xl overflow-hidden ${
        message.isPriority ? "border-amber-400/20" : message.isAnswered ? "border-white/4" : "border-white/8"
      }`}
    >
      {message.isPriority && (
        <div className="h-0.5 w-full bg-gradient-to-r from-amber-400/60 to-amber-600/40" />
      )}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-[10px] text-zinc-500 font-medium">?</div>
            <span className="text-xs text-zinc-500">Anonymous</span>
            {message.isPriority && (
              <span className="flex items-center gap-0.5 text-[9px] font-medium bg-amber-400/15 text-amber-300 border border-amber-400/20 px-1.5 py-0.5 rounded-full">
                <Zap className="w-2 h-2" /> Priority
              </span>
            )}
            {message.fee > 0n && (
              <span className="text-[9px] text-amber-400/70 ml-1">{formatCELO(message.fee)} CELO</span>
            )}
          </div>
          <span className="text-zinc-600 text-[10px]">{timeAgo(message.sentAt)}</span>
        </div>

        {/* Content */}
        <p className={`text-zinc-200 text-sm leading-relaxed mb-3 ${!expanded && isLong ? "line-clamp-3" : ""}`}>
          {message.content}
        </p>
        {isLong && (
          <button onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-0.5 text-xs text-zinc-500 hover:text-zinc-300 mb-3 transition-colors"
          >
            {expanded ? "Show less" : "Read more"}
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}

        {/* Reply */}
        {message.isAnswered && message.reply && (
          <div className="bg-violet-500/8 border border-violet-500/15 rounded-xl px-3 py-2 mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="relative w-4 h-4 rounded-full overflow-hidden">
                <Image src={creatorAvatar} alt={creatorName} fill className="object-cover" />
              </div>
              <span className="text-[10px] text-violet-400 font-medium">Your reply</span>
              {message.isPublished && (
                <span className="text-[9px] bg-green-400/15 text-green-400 px-1.5 py-0.5 rounded-full border border-green-400/20">Published</span>
              )}
            </div>
            <p className="text-zinc-300 text-xs leading-relaxed">{message.reply}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {!message.isAnswered && (
            <button onClick={() => onReply(message, msgIndex)}
              className="flex items-center gap-1 text-xs text-white bg-violet-700 hover:bg-violet-600 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <Reply className="w-3 h-3" /> Reply
            </button>
          )}
          {message.isAnswered && !message.isPublished && (
            <button onClick={() => publishToWall(BigInt(msgIndex))} disabled={isPending || isConfirming}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-green-400 border border-white/8 hover:border-green-500/25 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
            >
              {isPending || isConfirming ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />} Publish
            </button>
          )}
          <button onClick={() => archiveMessage(BigInt(msgIndex))} disabled={isPending || isConfirming}
            className="ml-auto flex items-center gap-1 text-xs text-zinc-700 hover:text-zinc-500 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <Archive className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InboxPage() {
  const { address }      = useAccount();
  const { profile }      = useCurrentCreator();

  const { data: inbox = [], isLoading: loadingInbox, refetch } = useInbox(address as Address | undefined);
  const { data: stats }  = useInboxStats(address as Address | undefined);
  const { data: earnings = 0n } = useEarnings(address as Address | undefined);
  const { claimEarnings, isPending: claimPending, isConfirmed: claimConfirmed } = useVeildContracts();

  const [tab, setTab]           = useState<Tab>("all");
  const [searchQuery, setSearch] = useState("");
  const [replyTarget, setReply]  = useState<{ msg: Message; index: number } | null>(null);

  const avatarUrl    = resolveAvatar(profile?.avatarCID ?? "", profile?.username ?? "");
  const creatorName  = profile?.name ?? "You";

  // Filter messages
  const visible = inbox.filter((m, i) => {
    if (m.isArchived) return false;
    if (tab === "priority") return m.isPriority;
    if (tab === "unanswered") return !m.isAnswered;
    if (searchQuery.trim()) return m.content.toLowerCase().includes(searchQuery.toLowerCase());
    return true;
  });

  const counts = {
    all:        inbox.filter(m => !m.isArchived).length,
    priority:   inbox.filter(m => m.isPriority && !m.isArchived).length,
    unanswered: inbox.filter(m => !m.isAnswered && !m.isArchived).length,
  };

  if (loadingInbox) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pb-24 animate-pulse">
        <div className="border-b border-white/5 h-14" />
        <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2"><div className="bg-[#111] rounded-xl h-14" /><div className="bg-[#111] rounded-xl h-14" /><div className="bg-[#111] rounded-xl h-14" /></div>
          <div className="bg-[#111] rounded-xl h-10" />
          <div className="bg-[#111] rounded-xl h-10" />
          {[0,1,2,3].map(i => <div key={i} className="bg-[#111] rounded-2xl h-24" />)}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-base leading-tight">Inbox</h1>
            {profile?.username && <p className="text-zinc-600 text-[10px]">@{profile.username}</p>}
          </div>
          {counts.unanswered > 0 && (
            <span className="text-xs font-medium bg-violet-600/20 text-violet-300 border border-violet-500/25 px-2.5 py-1 rounded-full">
              {counts.unanswered} unanswered
            </span>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4">
        {/* STATS */}
        <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
          <div className="bg-[#111] border border-white/5 rounded-xl p-3 text-center">
            <p className="font-bold text-lg leading-none">{stats ? formatNumber(stats.total) : "—"}</p>
            <p className="text-zinc-600 text-[10px] mt-0.5">messages</p>
          </div>
          <div className="bg-[#111] border border-amber-400/10 rounded-xl p-3 text-center">
            <p className="font-bold text-lg leading-none text-amber-300">{stats ? formatNumber(stats.priorityCount) : "—"}</p>
            <p className="text-zinc-600 text-[10px] mt-0.5">priority</p>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-xl p-3 text-center">
            <p className="font-bold text-lg leading-none text-green-400">
              {earnings > 0n ? formatCELO(earnings) : "0"} CELO
            </p>
            <p className="text-zinc-600 text-[10px] mt-0.5">earnings</p>
          </div>
        </div>

        {/* CLAIM EARNINGS */}
        {earnings > 0n && (
          <motion.button initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => claimEarnings()} disabled={claimPending || claimConfirmed}
            className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 bg-green-500/10 border border-green-500/25 text-green-300 text-xs font-medium rounded-xl hover:bg-green-500/15 transition-all disabled:opacity-60"
          >
            {claimPending || !claimConfirmed ? (claimPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null) : <Check className="w-3.5 h-3.5" />}
            {claimConfirmed ? "Claimed!" : `Claim ${formatCELO(earnings)} CELO`}
          </motion.button>
        )}

        {/* SEARCH */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
          <input type="text" value={searchQuery} onChange={e => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="w-full bg-[#111] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-violet-500/40 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* TABS */}
        <div className="flex gap-1 mb-4 bg-[#111] border border-white/5 rounded-xl p-1">
          {(["all","priority","unanswered"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                tab === t ? "bg-white text-black shadow-sm" : "text-zinc-500"
              }`}
            >
              {t === "priority" && <Zap className="w-3 h-3" />}
              {t}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                tab === t ? "bg-black/10 text-black/50" : "bg-white/5 text-zinc-600"
              }`}>{counts[t]}</span>
            </button>
          ))}
        </div>

        {/* MESSAGES */}
        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {visible.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
                <MessageCircle className="w-8 h-8 mx-auto mb-3 text-zinc-800" />
                <p className="text-zinc-600 text-sm">
                  {tab === "unanswered" ? "All caught up ✓" : tab === "priority" ? "No priority messages yet" : "No messages yet"}
                </p>
              </motion.div>
            ) : (
              visible.map((m, i) => (
                <MessageCard
                  key={m.id.toString()}
                  message={m}
                  msgIndex={inbox.indexOf(m)}
                  creatorAvatar={avatarUrl}
                  creatorName={creatorName}
                  onReply={(msg, idx) => setReply({ msg, index: idx })}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* REPLY SHEET */}
      <AnimatePresence>
        {replyTarget && (
          <ReplySheet
            message={replyTarget.msg}
            msgIndex={replyTarget.index}
            onClose={() => { setReply(null); refetch(); }}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
