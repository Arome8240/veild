"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Send, Check, Zap,
  MessageCircle, Heart, ChevronRight, Loader2,
} from "lucide-react";
import { useVeildContracts, useCreatorByUsername, useWallPosts, usePriorityFee } from "@/hooks/useVeildContracts";
import { useParticleBurst } from "@/hooks/useParticleBurst";
import { useMiniPay } from "@/hooks/useMiniPay";
import { useActivePools } from "@/hooks/usePools";
import { CreatorNotFound } from "@/components/creator/creator-not-found";
import { CreatorAvatar } from "@/components/creator/creator-avatar";
import { WalletStatus } from "@/components/wallet/wallet-status";
import { TipButton } from "@/components/creator/tip-button";
import { SubscribeButton } from "@/components/creator/subscribe-button";
import { PoolCard } from "@/components/creator/pool-card";
import { TipLeaderboard } from "@/components/creator/tip-leaderboard";
import { BadgeDisplay } from "@/components/creator/badge-display";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatNumber, timeAgo, formatCELO } from "@/lib/utils";
import {
  MAX_MESSAGE_CHARS,
  QUICK_PROMPTS,
  DEFAULT_PRIORITY_FEE_WEI,
  TOAST_DURATION_MS,
  WALL_PREVIEW_SIZE,
} from "@/constants/config";
import type { Address } from "viem";

export default function CreatorProfilePage({
  params,
}: {
  params: { username: string };
}) {
  // ── On-chain data ─────────────────────────────────────────────────────────
  const { data: creatorResult, isLoading: loadingCreator } =
    useCreatorByUsername(params.username);
  const creatorAddr = creatorResult?.[0] as Address | undefined;
  const creator     = creatorResult?.[1];

  const { data: wallPosts = [], isLoading: loadingWall } = useWallPosts(creatorAddr);
  const { data: priorityFeeOnChain } = usePriorityFee();
  const priorityFee = priorityFeeOnChain ?? DEFAULT_PRIORITY_FEE_WEI;

  // ── Wallet & contract writes ──────────────────────────────────────────────
  const { isConnected, address: fanAddress } = useMiniPay();
  const { data: activePools = [] } = useActivePools(creatorAddr);
  const {
    sendMessage: sendOnChain,
    sendPriorityMessage: sendPriorityOnChain,
    likeWallPost: likeOnChain,
    isPending, isConfirming, isConfirmed, reset: resetContract,
  } = useVeildContracts();

  // ── Local UI state ────────────────────────────────────────────────────────
  const [message, setMessage]       = useState("");
  const [isPriority, setIsPriority] = useState(false);
  const [sent, setSent]             = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const { particles, burst }        = useParticleBurst();

  const charsLeft = MAX_MESSAGE_CHARS - message.length;
  const canSend   = message.trim().length > 0 && !sent && !isPending && !isConfirming;

  // Show success when on-chain tx confirms
  useEffect(() => {
    if (!isConfirmed || sent) return;
    setSent(true);
    burst();
    const t = setTimeout(() => {
      setSent(false);
      setMessage("");
      setIsPriority(false);
      resetContract();
    }, TOAST_DURATION_MS);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed]);

  const handleSend = useCallback(() => {
    if (!canSend || !creatorAddr) return;
    if (isConnected) {
      isPriority
        ? sendPriorityOnChain(creatorAddr, message, priorityFee)
        : sendOnChain(creatorAddr, message);
    } else {
      setSent(true);
      burst();
      const t = setTimeout(() => {
        setSent(false);
        setMessage("");
        setIsPriority(false);
      }, TOAST_DURATION_MS);
      return () => clearTimeout(t);
    }
  }, [canSend, creatorAddr, isConnected, isPriority, message, priorityFee, sendPriorityOnChain, sendOnChain, burst]);

  const handleLike = useCallback((wallIndex: number) => {
    if (!creatorAddr || !isConnected) return;
    likeOnChain(creatorAddr, BigInt(wallIndex));
    setLikedPosts((prev) => new Set([...prev, wallIndex]));
  }, [creatorAddr, isConnected, likeOnChain]);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loadingCreator) {
    return (
      <div className="min-h-screen bg-background pb-16 animate-pulse">
        <div className="border-b border-border h-14" aria-hidden="true" />
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (
    !creator ||
    !creatorAddr ||
    creatorAddr === "0x0000000000000000000000000000000000000000" ||
    !creator.isActive
  ) {
    return <CreatorNotFound username={params.username} />;
  }

  const visibleWall    = wallPosts.slice(0, WALL_PREVIEW_SIZE);
  const firstName      = creator.name.split(" ")[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <Link href="/" className="flex items-center gap-2" aria-label="Veild home">
            <span className="font-bold text-sm tracking-tight">veild</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/inbox"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              My inbox
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* CREATOR HEADER */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4 mb-8"
          aria-label="Creator profile"
        >
          <CreatorAvatar avatarCID={creator.avatarCID} name={creator.name} size="lg" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-lg sm:text-xl leading-tight">
                {creator.name}
              </h1>
              {creator.isVerified && (
                <Badge variant="verified">Verified</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground text-xs">@{creator.username}</p>
              {creator.category && (
                <>
                  <span className="text-muted-foreground/40 text-xs" aria-hidden="true">·</span>
                  <span className="text-xs text-muted-foreground">{creator.category}</span>
                </>
              )}
            </div>
            <p className="text-muted-foreground text-xs mt-1 flex items-center gap-1">
              <MessageCircle className="w-3 h-3" aria-hidden="true" />
              <span>{formatNumber(creator.totalMessages)} messages received</span>
            </p>
            <div className="flex items-center gap-2 mt-2" aria-label="Fan actions">
              <TipButton creatorAddress={creatorAddr} creatorName={creator.name} />
              <SubscribeButton
                creatorAddress={creatorAddr}
                creatorName={creator.name}
                fanAddress={fanAddress}
              />
            </div>
            <div className="mt-2">
              <BadgeDisplay holderAddress={creatorAddr} />
            </div>
          </div>
        </motion.header>

        {creator.bio && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-muted-foreground text-sm leading-relaxed mb-8 bg-card rounded-xl p-4 border border-border"
          >
            {creator.bio}
          </motion.p>
        )}

        {/* MESSAGE FORM */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-10"
          aria-label="Send an anonymous message"
        >
          <h2 className="font-semibold text-sm mb-3 text-muted-foreground">
            Send an anonymous message to{" "}
            <span className="text-foreground">{firstName}</span>
          </h2>

          {/* Wallet connection status */}
          <div className="mb-3">
            <WalletStatus />
          </div>

          {/* Quick prompts */}
          {!message && (
            <div
              className="flex gap-2 mb-3 overflow-x-auto pb-1"
              aria-label="Quick message suggestions"
            >
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setMessage(prompt)}
                  className="shrink-0 text-xs text-muted-foreground border border-border hover:border-primary/30 hover:text-primary bg-card hover:bg-primary/5 px-3 py-1.5 rounded-full transition-all whitespace-nowrap"
                  aria-label={`Use prompt: ${prompt}`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Textarea */}
          <div
            className={`relative bg-card border rounded-2xl overflow-hidden transition-all duration-300 ${
              isPriority
                ? "border-amber-400/40 shadow-lg shadow-amber-400/10"
                : "border-border focus-within:border-ring"
            }`}
          >
            <label htmlFor="message-input" className="sr-only">
              Your anonymous message to {firstName}
            </label>
            <textarea
              id="message-input"
              value={message}
              onChange={(e) => {
                if (e.target.value.length <= MAX_MESSAGE_CHARS)
                  setMessage(e.target.value);
              }}
              placeholder={`Ask ${firstName} anything. It's anonymous.`}
              rows={4}
              aria-describedby="char-counter"
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm p-4 pb-2 resize-none outline-none leading-relaxed"
            />
            <div className="flex items-center justify-between px-4 pb-3 pt-1">
              <span
                id="char-counter"
                aria-live="polite"
                aria-label={`${charsLeft} characters remaining`}
                className={`text-xs tabular-nums ${
                  charsLeft < 30
                    ? charsLeft < 10
                      ? "text-destructive"
                      : "text-amber-400"
                    : "text-muted-foreground"
                }`}
              >
                {charsLeft}
              </span>
            </div>
          </div>

          {/* Priority toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={isPriority}
            aria-label={`Make priority (+${formatCELO(priorityFee)} CELO)`}
            onClick={() => setIsPriority(!isPriority)}
            className={`w-full mt-3 flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
              isPriority
                ? "bg-amber-400/10 border-amber-400/40 text-amber-300"
                : "bg-card border-border text-muted-foreground hover:border-border/80"
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap
                className={`w-4 h-4 ${isPriority ? "text-amber-400" : "text-muted-foreground"}`}
                aria-hidden="true"
              />
              <span>Make it priority</span>
              {isPriority && <Badge variant="priority">PRIORITY</Badge>}
            </div>
            <span className="font-semibold text-xs">
              +{formatCELO(priorityFee)} CELO
            </span>
          </button>

          {isPriority && (
            <p className="text-xs text-amber-400/70 mt-1.5 px-1">
              Priority messages get seen first and earn {firstName} CELO
            </p>
          )}

          {/* Send button */}
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                role="status"
                aria-live="polite"
                className="relative mt-3 w-full flex items-center justify-center gap-2 bg-green-500/15 border border-green-500/30 text-green-400 py-3 rounded-xl text-sm font-medium overflow-hidden"
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                Message sent anonymously!
                {particles.map((p) => (
                  <motion.span
                    key={p.id}
                    initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                    animate={{ opacity: 0, y: -60, x: p.x, scale: 0.3 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full pointer-events-none"
                    style={{ backgroundColor: p.color }}
                    aria-hidden="true"
                  />
                ))}
              </motion.div>
            ) : (
              <motion.button
                key="send"
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                aria-busy={isPending || isConfirming}
                className={`mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                  canSend
                    ? isPriority
                      ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {isPending || isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    {isPending ? "Confirm in wallet…" : "Confirming…"}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" aria-hidden="true" />
                    {isPriority
                      ? `Send Priority (+${formatCELO(priorityFee)} CELO)`
                      : "Send Anonymously"}
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>

          <p className="text-center text-xs text-muted-foreground mt-2">
            {isConnected
              ? "Sent on-chain — your address is not stored in the contract"
              : "Your identity is never revealed"}
          </p>
        </motion.section>

        {/* WALL PREVIEW */}
        {!loadingWall && visibleWall.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            aria-label={`${firstName}'s public wall`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm text-muted-foreground">
                From{" "}
                <span className="text-foreground">{firstName}&apos;s</span>{" "}
                wall
              </h2>
              <Link
                href={`/${creator.username}/wall`}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
                aria-label="View all wall posts"
              >
                See all <ChevronRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>

            <ul className="space-y-3" aria-label="Recent Q&As from this creator">
              {visibleWall.map((post, i) => (
                <li
                  key={post.id.toString()}
                  className="bg-card border border-border rounded-xl p-4 hover:border-border/80 transition-colors"
                >
                  <p className="text-muted-foreground text-xs mb-2 flex items-center gap-1.5">
                    <MessageCircle className="w-3 h-3" aria-hidden="true" />
                    Anonymous asked
                  </p>
                  <p className="text-foreground text-sm leading-relaxed mb-3">
                    &ldquo;{post.question}&rdquo;
                  </p>
                  <div className="border-l-2 border-primary/40 pl-3">
                    <p className="text-xs text-primary mb-1 font-medium">
                      {firstName} replied
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {post.answer}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      type="button"
                      onClick={() => handleLike(i)}
                      aria-pressed={likedPosts.has(i)}
                      aria-label={likedPosts.has(i) ? "Unlike" : "Like this Q&A"}
                      className={`flex items-center gap-1 text-xs transition-colors ${
                        likedPosts.has(i)
                          ? "text-pink-400"
                          : "text-muted-foreground hover:text-pink-400"
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${likedPosts.has(i) ? "fill-current" : ""}`}
                        aria-hidden="true"
                      />
                      <span aria-live="polite">
                        {formatNumber(post.likes + (likedPosts.has(i) ? 1n : 0n))}
                      </span>
                    </button>
                    <time
                      dateTime={new Date(Number(post.publishedAt) * 1000).toISOString()}
                      className="text-muted-foreground/60 text-xs"
                    >
                      {timeAgo(post.publishedAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              href={`/${creator.username}/wall`}
              className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-all"
            >
              View full wall
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </motion.section>
        )}
        {/* TIP LEADERBOARD */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28 }}
          className="mt-10"
        >
          <TipLeaderboard creatorAddress={creatorAddr} />
        </motion.div>

        {/* ACTIVE POOLS */}
        {activePools.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            aria-label={`${firstName}'s question pools`}
            className="mt-10"
          >
            <h2 className="font-semibold text-sm text-muted-foreground mb-4">
              <span className="text-foreground">{firstName}&apos;s</span> open questions
            </h2>
            <ul className="space-y-3" aria-label="Active question pools">
              {activePools.map((pool) => (
                <li key={pool.id.toString()}>
                  <PoolCard pool={pool} fanAddress={fanAddress} />
                </li>
              ))}
            </ul>
          </motion.section>
        )}
      </div>

      {/* FOOTER */}
      <footer className="mt-16 border-t border-border py-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          Powered by <span className="font-semibold">Veild</span>
        </Link>
      </footer>
    </div>
  );
}
