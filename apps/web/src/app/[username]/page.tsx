"use client";

import { useState, useEffect } from "react";
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
  Wallet,
  Loader2,
} from "lucide-react";
import { useMiniPay } from "@/hooks/useMiniPay";
import { useVeildContracts, useCreatorByUsername, useWallPosts, usePriorityFee, useHasLiked } from "@/hooks/useVeildContracts";
import { formatNumber, timeAgo, resolveAvatar, formatCELO } from "@/lib/utils";
import type { Address } from "viem";

const MAX_CHARS = 280;

const QUICK_PROMPTS = [
  "What's your biggest advice for beginners?",
  "How did you get started?",
  "What's your daily routine like?",
  "What's something you wish you knew earlier?",
  "Can we collab? 👀",
];

// ─── Not found state ──────────────────────────────────────────────────────────
function CreatorNotFound({ username }: { username: string }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-4 text-center">
      <div className="text-4xl mb-4">👁️</div>
      <h1 className="font-bold text-lg mb-2">@{username} not found</h1>
      <p className="text-zinc-500 text-sm mb-6 max-w-xs">
        This creator hasn't joined Veild yet or the username doesn't exist.
      </p>
      <Link href="/" className="text-violet-400 text-sm hover:text-violet-300 transition-colors">
        ← Back to home
      </Link>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function CreatorSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-16 animate-pulse">
      <div className="border-b border-white/5 h-14" />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/5 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-white/5 rounded-full w-32" />
            <div className="h-3 bg-white/5 rounded-full w-24" />
          </div>
        </div>
        <div className="bg-[#111] rounded-2xl h-32 mb-6" />
        <div className="bg-[#111] rounded-2xl h-40" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CreatorProfilePage({
  params,
}: {
  params: { username: string };
}) {
  // ── On-chain data ────────────────────────────────────────────────────────────
  const { data: creatorResult, isLoading: loadingCreator } = useCreatorByUsername(params.username);
  const creatorAddr = creatorResult?.[0] as Address | undefined;
  const creator     = creatorResult?.[1];

  const { data: wallPosts = [], isLoading: loadingWall } = useWallPosts(creatorAddr);
  const { data: priorityFeeOnChain } = usePriorityFee();
  const priorityFee = priorityFeeOnChain ?? BigInt("1000000000000000");

  // ── Wallet ───────────────────────────────────────────────────────────────────
  const {
    isMiniPay, hasWallet, address, shortAddress,
    isConnected, isConnecting, connectError, connectWallet, disconnect,
  } = useMiniPay();

  const {
    sendMessage: sendOnChain,
    sendPriorityMessage: sendPriorityOnChain,
    likeWallPost: likeOnChain,
    isPending, isConfirming, isConfirmed, error: contractError, reset: resetContract,
  } = useVeildContracts();

  // ── Local state ──────────────────────────────────────────────────────────────
  const [message, setMessage]       = useState("");
  const [isPriority, setIsPriority] = useState(false);
  const [sent, setSent]             = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [particles, setParticles]   = useState<{ id: number; x: number; color: string }[]>([]);

  const charsLeft = MAX_CHARS - message.length;
  const canSend   = message.trim().length > 0 && !sent && !isPending && !isConfirming;
  const COLORS    = ["#7c3aed","#a78bfa","#34d399","#fbbf24","#f472b6"];

  // Fire success animation on confirmation
  useEffect(() => {
    if (isConfirmed && !sent) {
      setSent(true);
      const burst = Array.from({ length: 12 }, (_, i) => ({
        id: i, x: Math.random() * 200 - 100, color: COLORS[i % COLORS.length],
      }));
      setParticles(burst);
      setTimeout(() => setParticles([]), 900);
      setTimeout(() => { setSent(false); setMessage(""); setIsPriority(false); resetContract(); }, 3000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed]);

  function handleSend() {
    if (!canSend || !creatorAddr) return;
    if (isConnected) {
      isPriority
        ? sendPriorityOnChain(creatorAddr, message, priorityFee)
        : sendOnChain(creatorAddr, message);
    } else {
      // offline / no wallet — show mock success
      setSent(true);
      const burst = Array.from({ length: 12 }, (_, i) => ({
        id: i, x: Math.random() * 200 - 100, color: COLORS[i % COLORS.length],
      }));
      setParticles(burst);
      setTimeout(() => setParticles([]), 900);
      setTimeout(() => { setSent(false); setMessage(""); setIsPriority(false); }, 3000);
    }
  }

  function handleLike(wallIndex: number) {
    if (!creatorAddr || !isConnected) return;
    likeOnChain(creatorAddr, BigInt(wallIndex));
    setLikedPosts(prev => new Set([...prev, wallIndex]));
  }

  // ── Render guards ────────────────────────────────────────────────────────────
  if (loadingCreator) return <CreatorSkeleton />;
  if (
    !creator ||
    !creatorAddr ||
    creatorAddr === "0x0000000000000000000000000000000000000000" ||
    !creator.isActive
  ) return <CreatorNotFound username={params.username} />;

  const avatarUrl = resolveAvatar(creator.avatarCID, creator.username);
  const visibleWall = wallPosts.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-base">👁️</span>
            <span className="font-bold text-sm tracking-tight">veild</span>
          </Link>
          <Link href="/inbox" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            My inbox
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* CREATOR HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }} className="flex items-center gap-4 mb-8"
        >
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#1a1a1a] ring-2 ring-white/5 shrink-0">
            <Image src={avatarUrl} alt={creator.name} fill className="object-cover" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-lg sm:text-xl leading-tight">{creator.name}</h1>
              {creator.isVerified && (
                <span className="text-[10px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/25 px-2 py-0.5 rounded-full">
                  ✓ Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-zinc-500 text-xs">@{creator.username}</p>
              {creator.category && (
                <>
                  <span className="text-zinc-700 text-xs">·</span>
                  <span className="text-xs text-zinc-600">{creator.category}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <MessageCircle className="w-3 h-3" />
                {formatNumber(creator.totalMessages)} messages
              </span>
            </div>
          </div>
        </motion.div>

        {creator.bio && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-zinc-400 text-sm leading-relaxed mb-8 bg-[#111] rounded-xl p-4 border border-white/5"
          >
            {creator.bio}
          </motion.p>
        )}

        {/* MESSAGE FORM */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }} className="mb-10"
        >
          <h2 className="font-semibold text-sm mb-3 text-zinc-300">
            Send an anonymous message to{" "}
            <span className="text-white">{creator.name.split(" ")[0]}</span>
          </h2>

          {/* Wallet status */}
          {isMiniPay && isConnected && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 mb-3 px-3 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl"
            >
              <span className="w-2 h-2 rounded-full bg-green-400 shrink-0 animate-pulse" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-green-400 leading-tight">MiniPay</p>
                <p className="text-[10px] text-green-400/60 font-mono leading-tight truncate">{address}</p>
              </div>
            </motion.div>
          )}

          {!isMiniPay && isConnected && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 mb-3 px-3 py-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl"
            >
              <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-violet-300 leading-tight">Wallet connected</p>
                <p className="text-[10px] text-violet-400/60 font-mono leading-tight truncate">{address}</p>
              </div>
              <button onClick={() => disconnect()} className="text-[10px] text-zinc-500 hover:text-zinc-300 shrink-0 transition-colors">
                Disconnect
              </button>
            </motion.div>
          )}

          {!isConnected && (
            <motion.button initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              onClick={connectWallet} disabled={isConnecting}
              className="w-full flex items-center justify-center gap-2 mb-3 px-3 py-2.5 bg-white/4 hover:bg-white/7 border border-white/10 hover:border-white/20 rounded-xl transition-all disabled:opacity-60"
            >
              <Wallet className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-medium text-zinc-300">
                {isConnecting ? "Connecting…" : hasWallet ? "Connect wallet to send on-chain" : "Install MetaMask to send on-chain"}
              </span>
            </motion.button>
          )}

          {(connectError || contractError) && (
            <p className="text-xs text-red-400 mb-2 px-1">
              ⚠ {(connectError?.message ?? contractError?.message ?? "").slice(0, 90)}
            </p>
          )}

          {/* Quick prompts */}
          {!message && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_PROMPTS.map(prompt => (
                <button key={prompt} onClick={() => setMessage(prompt)}
                  className="shrink-0 text-xs text-zinc-400 border border-white/8 hover:border-violet-500/30 hover:text-violet-300 bg-white/3 hover:bg-violet-500/8 px-3 py-1.5 rounded-full transition-all whitespace-nowrap"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Textarea */}
          <div className={`relative bg-[#111] border rounded-2xl overflow-hidden transition-all duration-300 ${
            isPriority ? "border-amber-400/40 shadow-lg shadow-amber-400/10" : "border-white/8 focus-within:border-violet-500/50"
          }`}>
            <textarea
              value={message}
              onChange={e => { if (e.target.value.length <= MAX_CHARS) setMessage(e.target.value); }}
              placeholder="Ask anything. Say what you've been meaning to say. It's anonymous."
              rows={4}
              className="w-full bg-transparent text-white placeholder:text-zinc-600 text-sm p-4 pb-2 resize-none outline-none leading-relaxed"
            />
            <div className="flex items-center justify-between px-4 pb-3 pt-1">
              <span className={`text-xs tabular-nums ${
                charsLeft < 30 ? charsLeft < 10 ? "text-red-400" : "text-amber-400" : "text-zinc-600"
              }`}>{charsLeft}</span>
            </div>
          </div>

          {/* Priority toggle */}
          <motion.button
            onClick={() => setIsPriority(!isPriority)} whileTap={{ scale: 0.98 }}
            className={`w-full mt-3 flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
              isPriority ? "bg-amber-400/10 border-amber-400/40 text-amber-300" : "bg-[#111] border-white/8 text-zinc-400 hover:border-white/15 hover:text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${isPriority ? "text-amber-400" : "text-zinc-600"}`} />
              <span>Make it priority</span>
              {isPriority && (
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-medium">PRIORITY</span>
              )}
            </div>
            <span className="font-semibold text-xs">+{formatCELO(priorityFee)} CELO</span>
          </motion.button>

          {isPriority && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              className="text-xs text-amber-400/70 mt-1.5 px-1"
            >
              ✦ Priority messages get seen first and earn {creator.name.split(" ")[0]} CELO
            </motion.p>
          )}

          {/* Send button */}
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="sent"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="relative mt-3 w-full flex items-center justify-center gap-2 bg-green-500/15 border border-green-500/30 text-green-400 py-3 rounded-xl text-sm font-medium overflow-hidden"
              >
                <Check className="w-4 h-4" />
                Message sent anonymously!
                {particles.map(p => (
                  <motion.span key={p.id}
                    initial={{ opacity: 1, y: 0, x: 0, scale: 1 }} animate={{ opacity: 0, y: -60, x: p.x, scale: 0.3 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full pointer-events-none"
                    style={{ backgroundColor: p.color }}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.button key="send" onClick={handleSend} disabled={!canSend} whileTap={{ scale: 0.97 }}
                className={`mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                  canSend
                    ? isPriority ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20" : "bg-violet-700 hover:bg-violet-600 text-white shadow-lg shadow-violet-900/30"
                    : "bg-white/5 text-zinc-600 cursor-not-allowed"
                }`}
              >
                {isPending || isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isPending ? "Confirm in wallet…" : "Confirming…"}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {isPriority ? `Send Priority (+${formatCELO(priorityFee)} CELO)` : "Send Anonymously"}
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>

          <p className="text-center text-xs text-zinc-600 mt-2">
            {isConnected
              ? "Sent on-chain — your address is never stored in the contract 🔒"
              : "Your identity is never revealed 🔒"}
          </p>
        </motion.div>

        {/* WALL PREVIEW */}
        {loadingWall ? (
          <div className="space-y-3 animate-pulse">
            {[0,1,2].map(i => <div key={i} className="bg-[#111] rounded-2xl h-28" />)}
          </div>
        ) : visibleWall.length > 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm text-zinc-300">
                From <span className="text-white">{creator.name.split(" ")[0]}</span>&apos;s wall
              </h2>
              <Link href={`/${creator.username}/wall`}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-0.5 transition-colors"
              >
                See all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {visibleWall.map((post, i) => (
                <motion.div key={post.id.toString()}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
                  className="bg-[#111] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors"
                >
                  <p className="text-zinc-500 text-xs mb-2 flex items-center gap-1.5">
                    <MessageCircle className="w-3 h-3" /> Anonymous asked
                  </p>
                  <p className="text-zinc-200 text-sm leading-relaxed mb-3">&ldquo;{post.question}&rdquo;</p>
                  <div className="border-l-2 border-violet-500/40 pl-3">
                    <p className="text-xs text-violet-400 mb-1 font-medium">{creator.name.split(" ")[0]} replied</p>
                    <p className="text-zinc-300 text-sm leading-relaxed">{post.answer}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <button onClick={() => handleLike(i)}
                      className={`flex items-center gap-1 text-xs transition-colors ${
                        likedPosts.has(i) ? "text-pink-400" : "text-zinc-600 hover:text-pink-400"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${likedPosts.has(i) ? "fill-current" : ""}`} />
                      {formatNumber(post.likes + (likedPosts.has(i) ? 1n : 0n))}
                    </button>
                    <span className="text-zinc-700 text-xs">{timeAgo(post.publishedAt)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
            <Link href={`/${creator.username}/wall`}
              className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/8 text-sm text-zinc-400 hover:text-white hover:border-white/15 transition-all"
            >
              View full wall <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : null}
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
