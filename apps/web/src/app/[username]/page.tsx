"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Check,
  Zap,
  MessageCircle,
  Users,
  Heart,
  ChevronRight,
} from "lucide-react";
import {
  getCreatorByUsername,
  getCreatorWallPosts,
  mockCreators,
} from "@/lib/mockData";

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

const MAX_CHARS = 280;

const QUICK_PROMPTS = [
  "What's your biggest advice for beginners?",
  "How did you get started?",
  "What's your daily routine like?",
  "What's something you wish you knew earlier?",
  "Can we collab? 👀",
];

export default function CreatorProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const creator = getCreatorByUsername(params.username) ?? mockCreators[0];
  const wallPosts = getCreatorWallPosts(creator.id).slice(0, 4);

  const [message, setMessage] = useState("");
  const [isPriority, setIsPriority] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const charsLeft = MAX_CHARS - message.length;
  const canSend = message.trim().length > 0 && !sent;

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setMessage("");
      setIsPriority(false);
    }, 3000);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-base">👁️</span>
            <span className="font-bold text-sm tracking-tight">veild</span>
          </Link>
          <Link
            href="/inbox"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            My inbox
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* CREATOR HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#1a1a1a] ring-2 ring-white/5 shrink-0">
            <Image
              src={creator.avatar}
              alt={creator.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-lg sm:text-xl leading-tight">
              {creator.name}
            </h1>
            <p className="text-zinc-500 text-sm">@{creator.username}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Users className="w-3 h-3" />
                {formatNumber(creator.followers)} followers
              </span>
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <MessageCircle className="w-3 h-3" />
                {formatNumber(creator.totalMessages)} messages
              </span>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-zinc-400 text-sm leading-relaxed mb-8 bg-[#111] rounded-xl p-4 border border-white/5"
        >
          {creator.bio}
        </motion.p>

        {/* MESSAGE FORM */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-10"
        >
          <h2 className="font-semibold text-sm mb-3 text-zinc-300">
            Send an anonymous message to{" "}
            <span className="text-white">{creator.name.split(" ")[0]}</span>
          </h2>

          {/* Quick prompts */}
          {!message && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setMessage(prompt)}
                  className="shrink-0 text-xs text-zinc-400 border border-white/8 hover:border-violet-500/30 hover:text-violet-300 bg-white/3 hover:bg-violet-500/8 px-3 py-1.5 rounded-full transition-all whitespace-nowrap"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div
            className={`relative bg-[#111] border rounded-2xl overflow-hidden transition-all duration-300 ${
              isPriority
                ? "border-amber-400/40 shadow-lg shadow-amber-400/10 animate-glow"
                : "border-white/8 focus-within:border-violet-500/50"
            }`}
          >
            <textarea
              value={message}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) setMessage(e.target.value);
              }}
              placeholder="Ask anything. Say what you've been meaning to say. It's anonymous."
              rows={4}
              className="w-full bg-transparent text-white placeholder:text-zinc-600 text-sm p-4 pb-2 resize-none outline-none leading-relaxed"
            />

            <div className="flex items-center justify-between px-4 pb-3 pt-1">
              {/* Char counter */}
              <span
                className={`text-xs tabular-nums ${
                  charsLeft < 30
                    ? charsLeft < 10
                      ? "text-red-400"
                      : "text-amber-400"
                    : "text-zinc-600"
                }`}
              >
                {charsLeft}
              </span>
            </div>
          </div>

          {/* Priority toggle */}
          <motion.button
            onClick={() => setIsPriority(!isPriority)}
            className={`w-full mt-3 flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
              isPriority
                ? "bg-amber-400/10 border-amber-400/40 text-amber-300"
                : "bg-[#111] border-white/8 text-zinc-400 hover:border-white/15 hover:text-zinc-300"
            }`}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-2">
              <Zap
                className={`w-4 h-4 ${
                  isPriority ? "text-amber-400" : "text-zinc-600"
                }`}
              />
              <span>Make it priority</span>
              {isPriority && (
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-medium">
                  PRIORITY
                </span>
              )}
            </div>
            <span className="font-semibold text-xs">+$1.00</span>
          </motion.button>

          {isPriority && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-amber-400/70 mt-1.5 px-1"
            >
              ✦ Priority messages get seen first and earn {creator.name.split(" ")[0]} $1
            </motion.p>
          )}

          {/* Send button */}
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-3 w-full flex items-center justify-center gap-2 bg-green-500/15 border border-green-500/30 text-green-400 py-3 rounded-xl text-sm font-medium"
              >
                <Check className="w-4 h-4" />
                Message sent anonymously!
              </motion.div>
            ) : (
              <motion.button
                key="send"
                onClick={handleSend}
                disabled={!canSend || sending}
                whileTap={{ scale: 0.97 }}
                className={`mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                  canSend && !sending
                    ? isPriority
                      ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20"
                      : "bg-violet-700 hover:bg-violet-600 text-white shadow-lg shadow-violet-900/30"
                    : "bg-white/5 text-zinc-600 cursor-not-allowed"
                }`}
              >
                {sending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {isPriority ? "Send Priority Message" : "Send Anonymously"}
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>

          <p className="text-center text-xs text-zinc-600 mt-2">
            Your identity is never revealed 🔒
          </p>
        </motion.div>

        {/* WALL PREVIEW */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-zinc-300">
              From{" "}
              <span className="text-white">{creator.name.split(" ")[0]}</span>
              &apos;s wall
            </h2>
            <Link
              href={`/${creator.username}/wall`}
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-0.5 transition-colors"
            >
              See all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {wallPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
                className="bg-[#111] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors"
              >
                <p className="text-zinc-500 text-xs mb-2 flex items-center gap-1.5">
                  <MessageCircle className="w-3 h-3" />
                  Anonymous asked
                </p>
                <p className="text-zinc-200 text-sm leading-relaxed mb-3">
                  &ldquo;{post.question}&rdquo;
                </p>
                <div className="border-l-2 border-violet-500/40 pl-3">
                  <p className="text-xs text-violet-400 mb-1 font-medium">
                    {creator.name.split(" ")[0]} replied
                  </p>
                  <p className="text-zinc-300 text-sm leading-relaxed">
                    {post.answer}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className="flex items-center gap-1 text-xs text-zinc-600">
                    <Heart className="w-3 h-3" />
                    {post.likes}
                  </span>
                  <span className="text-zinc-700 text-xs">
                    {timeAgo(post.timestamp)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <Link
            href={`/${creator.username}/wall`}
            className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/8 text-sm text-zinc-400 hover:text-white hover:border-white/15 transition-all"
          >
            View full wall
            <ChevronRight className="w-4 h-4" />
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
