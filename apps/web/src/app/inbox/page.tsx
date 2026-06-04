"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, MessageCircle, Search, X, Check, Loader2,
} from "lucide-react";
import { useAccount } from "wagmi";
import { useInbox, useInboxStats, useEarnings, useVeildContracts } from "@/hooks/useVeildContracts";
import { useCurrentCreator } from "@/hooks/useCurrentCreator";
import { useMessageFilter } from "@/hooks/useMessageFilter";
import { MessageCard } from "@/components/message/message-card";
import { ReplySheet } from "@/components/message/reply-sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/components/bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatCELO, formatNumber } from "@/lib/utils";
import type { InboxTab, IndexedMessage } from "@/types";
import type { Address } from "viem";

export default function InboxPage() {
  const { address }  = useAccount();
  const { profile }  = useCurrentCreator();

  const { data: rawInbox = [], isLoading, refetch } = useInbox(address as Address | undefined);
  const { data: stats }    = useInboxStats(address as Address | undefined);
  const { data: earnings = 0n } = useEarnings(address as Address | undefined);
  const { claimEarnings, isPending: claimPending, isConfirmed: claimDone } =
    useVeildContracts();

  const [tab, setTab]         = useState<InboxTab>("all");
  const [search, setSearch]   = useState("");
  const [replyTarget, setReplyTarget] = useState<IndexedMessage | null>(null);

  const { visible, counts } = useMessageFilter(rawInbox, tab, search);

  const creatorName = profile?.name ?? "You";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="border-b border-border h-14" aria-hidden="true" />
        <div className="max-w-lg mx-auto px-4 pt-4 space-y-3" aria-busy="true" aria-label="Loading inbox">
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-base leading-tight text-foreground">Inbox</h1>
            {profile?.username && (
              <p className="text-muted-foreground text-[10px]">@{profile.username}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {counts.unanswered > 0 && (
              <span
                className="text-xs font-medium bg-primary/20 text-primary border border-primary/25 px-2.5 py-1 rounded-full"
                aria-live="polite"
              >
                {counts.unanswered} unanswered
              </span>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4">
        {/* STATS */}
        <dl className="grid grid-cols-3 gap-2 mt-4 mb-4" aria-label="Inbox statistics">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <dt className="text-muted-foreground text-[10px] mt-0.5">messages</dt>
            <dd className="font-bold text-lg leading-none">
              {stats ? formatNumber(stats.total) : "—"}
            </dd>
          </div>
          <div className="bg-card border border-amber-400/10 rounded-xl p-3 text-center">
            <dt className="text-muted-foreground text-[10px] mt-0.5">priority</dt>
            <dd className="font-bold text-lg leading-none text-amber-300">
              {stats ? formatNumber(stats.priorityCount) : "—"}
            </dd>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <dt className="text-muted-foreground text-[10px] mt-0.5">earned</dt>
            <dd className="font-bold text-lg leading-none text-green-400">
              {formatCELO(earnings)} CELO
            </dd>
          </div>
        </dl>

        {/* CLAIM EARNINGS */}
        {earnings > 0n && (
          <motion.button
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => claimEarnings()}
            disabled={claimPending || claimDone}
            aria-busy={claimPending}
            className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 bg-green-500/10 border border-green-500/25 text-green-300 text-xs font-medium rounded-xl hover:bg-green-500/15 transition-all disabled:opacity-60"
          >
            {claimDone ? (
              <><Check className="w-3.5 h-3.5" aria-hidden="true" /> Claimed!</>
            ) : claimPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : null}
            {!claimDone && `Claim ${formatCELO(earnings)} CELO`}
          </motion.button>
        )}

        {/* SEARCH */}
        <div className="relative mb-3">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <label htmlFor="inbox-search" className="sr-only">Search messages</label>
          <input
            id="inbox-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* TABS */}
        <div
          role="tablist"
          aria-label="Filter messages"
          className="flex gap-1 mb-4 bg-card border border-border rounded-xl p-1"
        >
          {(["all", "priority", "unanswered"] as InboxTab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                tab === t
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "priority" && (
                <Zap className="w-3 h-3" aria-hidden="true" />
              )}
              {t}
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                  tab === t
                    ? "bg-background/10 text-background/60"
                    : "bg-muted text-muted-foreground"
                }`}
                aria-label={`${counts[t]} messages`}
              >
                {counts[t]}
              </span>
            </button>
          ))}
        </div>

        {/* MESSAGE LIST */}
        <div
          role="tabpanel"
          aria-label={`${tab} messages`}
          className="space-y-2.5"
        >
          <AnimatePresence mode="popLayout">
            {visible.length === 0 ? (
              <EmptyState
                key="empty"
                icon={MessageCircle}
                title={
                  tab === "unanswered"
                    ? "All caught up!"
                    : tab === "priority"
                    ? "No priority messages yet"
                    : search
                    ? "No messages match your search"
                    : "No messages yet"
                }
                description={
                  tab === "all" && !search
                    ? "Share your Veild link to start receiving anonymous messages."
                    : undefined
                }
              />
            ) : (
              visible.map((m: IndexedMessage) => (
                <MessageCard
                  key={m.id.toString()}
                  message={m}
                  creatorAvatar={profile?.avatarCID ?? ""}
                  creatorName={creatorName}
                  onReply={setReplyTarget}
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
            onClose={() => {
              setReplyTarget(null);
              refetch();
            }}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
