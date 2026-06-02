"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Reply,
  Eye,
  Archive,
  X,
  Check,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import {
  mockMessages,
  mockCreators,
  getCreatorStats,
  type Message,
} from "@/lib/mockData";
import { BottomNav } from "@/components/bottom-nav";

const ME = mockCreators[0];

function timeAgo(date: Date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

type Tab = "all" | "priority" | "unanswered";

// ─── Reply Sheet ──────────────────────────────────────────────────────────────
function ReplySheet({
  message,
  onClose,
  onSubmit,
}: {
  message: Message | null;
  onClose: () => void;
  onSubmit: (id: string, reply: string, publish: boolean) => void;
}) {
  const [reply, setReply] = useState("");
  const [publishToWall, setPublishToWall] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  if (!message) return null;

  async function handleSubmit() {
    if (!reply.trim()) return;
    setStatus("sending");
    await new Promise((r) => setTimeout(r, 700));
    setStatus("sent");
    await new Promise((r) => setTimeout(r, 600));
    onSubmit(message!.id, reply, publishToWall);
    onClose();
    setStatus("idle");
    setReply("");
    setPublishToWall(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full bg-[#141414] border-t border-white/10 rounded-t-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto"
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Reply</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Original message */}
        <div className="bg-white/4 border border-white/6 rounded-xl px-3.5 py-3 mb-4">
          <p className="text-[10px] text-zinc-500 mb-1">Anonymous asked</p>
          <p className="text-zinc-200 text-sm leading-relaxed line-clamp-3">
            &ldquo;{message.content}&rdquo;
          </p>
        </div>

        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Your reply..."
          rows={4}
          autoFocus
          className="w-full bg-[#1c1c1c] border border-white/8 focus:border-violet-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 resize-none outline-none transition-colors leading-relaxed mb-3"
        />

        {/* Publish toggle */}
        <button
          onClick={() => setPublishToWall(!publishToWall)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm mb-4 transition-all ${
            publishToWall
              ? "bg-green-500/10 border-green-500/25 text-green-300"
              : "bg-white/3 border-white/8 text-zinc-400"
          }`}
        >
          <div className="flex items-center gap-2 text-xs">
            <Eye className="w-3.5 h-3.5" />
            Publish to wall
          </div>
          <div
            className={`w-9 h-5 rounded-full transition-colors relative ${
              publishToWall ? "bg-green-500" : "bg-white/10"
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                publishToWall ? "left-[18px]" : "left-0.5"
              }`}
            />
          </div>
        </button>

        <button
          onClick={handleSubmit}
          disabled={!reply.trim() || status !== "idle"}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all ${
            status === "sent"
              ? "bg-green-500/15 border border-green-500/25 text-green-300"
              : reply.trim() && status === "idle"
              ? "bg-violet-700 hover:bg-violet-600 text-white"
              : "bg-white/5 text-zinc-600 cursor-not-allowed"
          }`}
        >
          {status === "sent" ? (
            <>
              <Check className="w-4 h-4" /> Sent!
            </>
          ) : status === "sending" ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            />
          ) : (
            <>
              <Reply className="w-4 h-4" /> Send Reply
            </>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Message Card ─────────────────────────────────────────────────────────────
function MessageCard({
  message,
  onReply,
  onPublish,
  onArchive,
}: {
  message: Message;
  onReply: (m: Message) => void;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = message.content.length > 120;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.18 } }}
      className={`relative bg-[#111] border rounded-2xl overflow-hidden ${
        message.isPriority
          ? "border-amber-400/20"
          : message.isAnswered
          ? "border-white/4"
          : "border-white/8"
      }`}
    >
      {/* Priority strip */}
      {message.isPriority && (
        <div className="h-0.5 w-full bg-gradient-to-r from-amber-400/60 to-amber-600/40" />
      )}

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-[10px] text-zinc-500 font-medium">
              ?
            </div>
            <span className="text-xs text-zinc-500">Anonymous</span>
            {message.isPriority && (
              <span className="flex items-center gap-0.5 text-[9px] font-medium bg-amber-400/15 text-amber-300 border border-amber-400/20 px-1.5 py-0.5 rounded-full">
                <Zap className="w-2 h-2" /> Priority
              </span>
            )}
          </div>
          <span className="text-zinc-600 text-[10px]">{timeAgo(message.timestamp)}</span>
        </div>

        {/* Message text */}
        <p
          className={`text-zinc-200 text-sm leading-relaxed mb-3 ${
            !expanded && isLong ? "line-clamp-3" : ""
          }`}
        >
          {message.content}
        </p>

        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-0.5 text-xs text-zinc-500 hover:text-zinc-300 mb-3 transition-colors"
          >
            {expanded ? "Show less" : "Read more"}
            <ChevronDown
              className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        )}

        {/* Reply preview */}
        {message.reply && (
          <div className="bg-violet-500/8 border border-violet-500/15 rounded-xl px-3 py-2 mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="relative w-4 h-4 rounded-full overflow-hidden">
                <Image src={ME.avatar} alt={ME.name} fill className="object-cover" />
              </div>
              <span className="text-[10px] text-violet-400 font-medium">Your reply</span>
              {message.isPublished && (
                <span className="text-[9px] bg-green-400/15 text-green-400 px-1.5 py-0.5 rounded-full border border-green-400/20">
                  Published
                </span>
              )}
            </div>
            <p className="text-zinc-300 text-xs leading-relaxed">{message.reply}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {!message.isAnswered && (
            <button
              onClick={() => onReply(message)}
              className="flex items-center gap-1 text-xs text-white bg-violet-700 hover:bg-violet-600 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <Reply className="w-3 h-3" /> Reply
            </button>
          )}
          {message.isAnswered && !message.isPublished && (
            <button
              onClick={() => onPublish(message.id)}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-green-400 border border-white/8 hover:border-green-500/25 px-3 py-1.5 rounded-lg transition-all"
            >
              <Eye className="w-3 h-3" /> Publish
            </button>
          )}
          <button
            onClick={() => onArchive(message.id)}
            className="ml-auto flex items-center gap-1 text-xs text-zinc-700 hover:text-zinc-500 px-2.5 py-1.5 rounded-lg transition-colors"
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
  const stats = getCreatorStats(ME.id);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [tab, setTab] = useState<Tab>("all");
  const [archived, setArchived] = useState<Set<string>>(new Set());
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);

  function handleArchive(id: string) {
    setArchived((prev) => new Set([...prev, id]));
  }

  function handlePublish(id: string) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isPublished: true } : m)));
  }

  function handleReply(id: string, reply: string, publish: boolean) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, isAnswered: true, reply, isPublished: publish } : m
      )
    );
  }

  const visible = messages.filter((m) => {
    if (archived.has(m.id)) return false;
    if (tab === "priority") return m.isPriority;
    if (tab === "unanswered") return !m.isAnswered;
    return true;
  });

  const counts = {
    all: messages.filter((m) => !archived.has(m.id)).length,
    priority: messages.filter((m) => m.isPriority && !archived.has(m.id)).length,
    unanswered: messages.filter((m) => !m.isAnswered && !archived.has(m.id)).length,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-base leading-tight">Inbox</h1>
            <p className="text-zinc-600 text-[10px]">@{ME.username}</p>
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
        <div className="grid grid-cols-2 gap-2 mt-4 mb-4">
          <div className="bg-[#111] border border-white/5 rounded-xl p-3 text-center">
            <p className="font-bold text-lg leading-none">{stats.totalMessages}</p>
            <p className="text-zinc-600 text-[10px] mt-0.5">total messages</p>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-xl p-3 text-center">
            <p className="font-bold text-lg leading-none text-green-400">
              ${ME.earnings.toFixed(2)}
            </p>
            <p className="text-zinc-600 text-[10px] mt-0.5">total earned</p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 mb-4 bg-[#111] border border-white/5 rounded-xl p-1">
          {(["all", "priority", "unanswered"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                tab === t ? "bg-white text-black shadow-sm" : "text-zinc-500"
              }`}
            >
              {t === "priority" && <Zap className="w-3 h-3" />}
              {t}
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                  tab === t ? "bg-black/10 text-black/50" : "bg-white/5 text-zinc-600"
                }`}
              >
                {counts[t]}
              </span>
            </button>
          ))}
        </div>

        {/* MESSAGES */}
        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {visible.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center"
              >
                <MessageCircle className="w-8 h-8 mx-auto mb-3 text-zinc-800" />
                <p className="text-zinc-600 text-sm">
                  {tab === "unanswered"
                    ? "All caught up ✓"
                    : tab === "priority"
                    ? "No priority messages yet"
                    : "No messages yet"}
                </p>
              </motion.div>
            ) : (
              visible.map((m) => (
                <MessageCard
                  key={m.id}
                  message={m}
                  onReply={setReplyTarget}
                  onPublish={handlePublish}
                  onArchive={handleArchive}
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
            message={replyTarget}
            onClose={() => setReplyTarget(null)}
            onSubmit={(id, reply, pub) => {
              handleReply(id, reply, pub);
              setReplyTarget(null);
            }}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
