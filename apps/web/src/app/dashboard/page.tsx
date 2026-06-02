"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  DollarSign,
  TrendingUp,
  Inbox,
  Zap,
  Reply,
  Eye,
  Archive,
  X,
  Check,
  Share2,
  Copy,
  ChevronRight,
  Bell,
  ExternalLink,
} from "lucide-react";
import {
  mockMessages,
  mockCreators,
  getCreatorStats,
  type Message,
} from "@/lib/mockData";

const DASHBOARD_CREATOR = mockCreators[0];

function timeAgo(date: Date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

type Tab = "all" | "priority" | "unanswered";

interface MessageCardProps {
  message: Message;
  onReply: (msg: Message) => void;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
  archived: boolean;
}

function MessageCard({ message, onReply, onPublish, onArchive, archived }: MessageCardProps) {
  if (archived) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      className={`relative bg-[#111] border rounded-2xl p-4 sm:p-5 transition-all ${
        message.isPriority
          ? "border-amber-400/25 hover:border-amber-400/40"
          : "border-white/5 hover:border-white/10"
      }`}
    >
      {/* Priority badge */}
      {message.isPriority && (
        <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-medium bg-amber-400/15 text-amber-300 border border-amber-400/25 px-2 py-0.5 rounded-full">
          <Zap className="w-2.5 h-2.5" />
          Priority
        </div>
      )}

      {/* Message */}
      <div className="pr-16 mb-3">
        <p className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1">
          <span className="w-4 h-4 bg-white/5 rounded-full flex items-center justify-center text-[8px]">
            ?
          </span>
          Anonymous fan
        </p>
        <p className="text-zinc-200 text-sm leading-relaxed">
          {message.content}
        </p>
      </div>

      {/* Reply (if answered) */}
      {message.isAnswered && message.reply && (
        <div className="bg-white/3 border border-white/5 rounded-xl px-3 py-2.5 mb-3">
          <p className="text-[10px] text-violet-400 font-medium mb-1">
            Your reply
          </p>
          <p className="text-zinc-300 text-xs leading-relaxed">{message.reply}</p>
          {message.isPublished && (
            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
              <Eye className="w-2.5 h-2.5" />
              Published to wall
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-zinc-600 text-xs">{timeAgo(message.timestamp)}</span>
        <div className="flex items-center gap-1">
          {!message.isAnswered && (
            <button
              onClick={() => onReply(message)}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-violet-400 border border-white/8 hover:border-violet-500/30 hover:bg-violet-500/10 px-2.5 py-1 rounded-lg transition-all"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>
          )}
          {message.isAnswered && !message.isPublished && (
            <button
              onClick={() => onPublish(message.id)}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-green-400 border border-white/8 hover:border-green-500/30 hover:bg-green-500/10 px-2.5 py-1 rounded-lg transition-all"
            >
              <Eye className="w-3 h-3" />
              Publish
            </button>
          )}
          <button
            onClick={() => onArchive(message.id)}
            className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-400 border border-white/5 hover:border-white/10 px-2.5 py-1 rounded-lg transition-all"
          >
            <Archive className="w-3 h-3" />
            Archive
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface ReplyModalProps {
  message: Message | null;
  onClose: () => void;
  onSubmit: (id: string, reply: string, publish: boolean) => void;
}

function ReplyModal({ message, onClose, onSubmit }: ReplyModalProps) {
  const [reply, setReply] = useState("");
  const [publishToWall, setPublishToWall] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!message) return null;

  async function handleSubmit() {
    if (!reply.trim() || !message) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    setSent(true);
    await new Promise((r) => setTimeout(r, 600));
    onSubmit(message.id, reply, publishToWall);
    onClose();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="w-full max-w-lg bg-[#141414] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-sm">Reply to message</h3>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Original message */}
          <div className="bg-white/3 border border-white/5 rounded-xl px-3.5 py-3 mb-4">
            <p className="text-[10px] text-zinc-500 mb-1">Anonymous fan asked</p>
            <p className="text-zinc-300 text-sm leading-relaxed">
              &ldquo;{message.content}&rdquo;
            </p>
          </div>

          {/* Reply textarea */}
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write your reply..."
            rows={4}
            autoFocus
            className="w-full bg-[#1a1a1a] border border-white/8 focus:border-violet-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 resize-none outline-none transition-colors leading-relaxed mb-4"
          />

          {/* Publish toggle */}
          <button
            onClick={() => setPublishToWall(!publishToWall)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm mb-4 transition-all ${
              publishToWall
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-white/3 border-white/8 text-zinc-400 hover:border-white/15"
            }`}
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Publish to wall
            </div>
            <div
              className={`w-8 h-4 rounded-full transition-all relative ${
                publishToWall ? "bg-green-500" : "bg-white/10"
              }`}
            >
              <div
                className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${
                  publishToWall ? "left-4" : "left-0.5"
                }`}
              />
            </div>
          </button>

          <button
            onClick={handleSubmit}
            disabled={!reply.trim() || sending || sent}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              sent
                ? "bg-green-500/15 border border-green-500/30 text-green-400"
                : reply.trim() && !sending
                ? "bg-violet-700 hover:bg-violet-600 text-white"
                : "bg-white/5 text-zinc-600 cursor-not-allowed"
            }`}
          >
            {sent ? (
              <>
                <Check className="w-4 h-4" />
                Reply sent!
              </>
            ) : sending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              />
            ) : (
              <>
                <Reply className="w-4 h-4" />
                Send Reply
              </>
            )}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function DashboardPage() {
  const stats = getCreatorStats(DASHBOARD_CREATOR.id);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [tab, setTab] = useState<Tab>("all");
  const [archived, setArchived] = useState<Set<string>>(new Set());
  const [published, setPublished] = useState<Set<string>>(new Set());
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const profileUrl = `veild.app/${DASHBOARD_CREATOR.username}`;

  function copyLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`https://${profileUrl}`);
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function handleArchive(id: string) {
    setArchived((prev) => new Set([...prev, id]));
  }

  function handlePublish(id: string) {
    setPublished((prev) => new Set([...prev, id]));
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isPublished: true } : m))
    );
  }

  function handleReplySubmit(id: string, reply: string, publish: boolean) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, isAnswered: true, reply, isPublished: publish }
          : m
      )
    );
    if (publish) setPublished((prev) => new Set([...prev, id]));
  }

  const filtered = messages.filter((m) => {
    if (archived.has(m.id)) return false;
    if (tab === "priority") return m.isPriority;
    if (tab === "unanswered") return !m.isAnswered;
    return true;
  });

  const unreadCount = messages.filter((m) => !m.isAnswered && !archived.has(m.id)).length;

  const tabCounts = {
    all: messages.filter((m) => !archived.has(m.id)).length,
    priority: messages.filter((m) => m.isPriority && !archived.has(m.id)).length,
    unanswered: messages.filter((m) => !m.isAnswered && !archived.has(m.id)).length,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-base">👁️</span>
            <span className="font-bold text-sm tracking-tight">veild</span>
          </Link>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
                <Bell className="w-3 h-3" />
                {unreadCount} new
              </div>
            )}
            <Link
              href={`/${DASHBOARD_CREATOR.username}`}
              className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
            >
              Your profile
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* PAGE HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#1a1a1a] ring-2 ring-white/5 shrink-0">
              <Image
                src={DASHBOARD_CREATOR.avatar}
                alt={DASHBOARD_CREATOR.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Inbox</h1>
              <p className="text-zinc-500 text-xs">@{DASHBOARD_CREATOR.username}</p>
            </div>
          </div>

          {/* Share link */}
          <button
            onClick={copyLink}
            className="flex items-center gap-2 bg-[#111] border border-white/8 hover:border-white/15 rounded-xl px-4 py-2.5 text-sm transition-all group"
          >
            <span className="text-zinc-500 text-xs font-mono truncate max-w-[140px]">
              {profileUrl}
            </span>
            {linkCopied ? (
              <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 shrink-0 transition-colors" />
            )}
          </button>
        </motion.div>

        {/* STATS BAR */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
        >
          {[
            {
              icon: MessageCircle,
              label: "Total messages",
              value: stats.totalMessages.toString(),
              sub: "all time",
              color: "violet",
            },
            {
              icon: Inbox,
              label: "Unread",
              value: stats.unread.toString(),
              sub: "need reply",
              color: "amber",
            },
            {
              icon: DollarSign,
              label: "Earned",
              value: `$${stats.earnings.toFixed(2)}`,
              sub: "this month",
              color: "green",
            },
            {
              icon: TrendingUp,
              label: "Reply rate",
              value: `${stats.replyRate}%`,
              sub: "last 30 days",
              color: "blue",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.35 }}
              className="bg-[#111] border border-white/5 rounded-2xl p-4"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${
                  stat.color === "violet"
                    ? "bg-violet-500/10"
                    : stat.color === "amber"
                    ? "bg-amber-400/10"
                    : stat.color === "green"
                    ? "bg-green-500/10"
                    : "bg-blue-500/10"
                }`}
              >
                <stat.icon
                  className={`w-4 h-4 ${
                    stat.color === "violet"
                      ? "text-violet-400"
                      : stat.color === "amber"
                      ? "text-amber-400"
                      : stat.color === "green"
                      ? "text-green-400"
                      : "text-blue-400"
                  }`}
                />
              </div>
              <p className="text-xl font-bold leading-none mb-1">{stat.value}</p>
              <p className="text-zinc-500 text-xs">{stat.label}</p>
              <p className="text-zinc-700 text-[10px] mt-0.5">{stat.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* TABS */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex gap-1 bg-[#111] border border-white/5 rounded-xl p-1 mb-6 w-fit"
        >
          {(["all", "priority", "unanswered"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all capitalize ${
                tab === t
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t === "priority" && <Zap className="w-3 h-3" />}
              {t}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  tab === t ? "bg-black/10 text-black/60" : "bg-white/5 text-zinc-600"
                }`}
              >
                {tabCounts[t]}
              </span>
            </button>
          ))}
        </motion.div>

        {/* MESSAGE LIST */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 text-zinc-600"
              >
                <MessageCircle className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  {tab === "unanswered"
                    ? "All caught up! No unanswered messages."
                    : tab === "priority"
                    ? "No priority messages yet."
                    : "No messages yet. Share your Veild link!"}
                </p>
              </motion.div>
            ) : (
              filtered.map((message) => (
                <MessageCard
                  key={message.id}
                  message={message}
                  onReply={setReplyTarget}
                  onPublish={handlePublish}
                  onArchive={handleArchive}
                  archived={archived.has(message.id)}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* SHARE SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-12 bg-gradient-to-b from-violet-900/20 to-[#111] border border-violet-500/15 rounded-2xl p-6 text-center"
        >
          <p className="text-sm font-semibold mb-1">Get more messages</p>
          <p className="text-zinc-500 text-xs mb-4">
            Share your Veild link and let your fans speak freely.
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <button
              onClick={copyLink}
              className="flex items-center gap-2 bg-violet-700 hover:bg-violet-600 transition-all text-white text-xs font-medium px-4 py-2 rounded-full"
            >
              {linkCopied ? (
                <>
                  <Check className="w-3 h-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy link
                </>
              )}
            </button>
            <Link
              href={`/${DASHBOARD_CREATOR.username}/wall`}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 transition-all text-zinc-300 text-xs font-medium px-4 py-2 rounded-full border border-white/8"
            >
              <Eye className="w-3 h-3" />
              View wall
            </Link>
          </div>
        </motion.div>
      </div>

      {/* REPLY MODAL */}
      {replyTarget && (
        <ReplyModal
          message={replyTarget}
          onClose={() => setReplyTarget(null)}
          onSubmit={handleReplySubmit}
        />
      )}
    </div>
  );
}
