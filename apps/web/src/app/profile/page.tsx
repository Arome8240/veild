"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Check, Share2, ExternalLink,
  MessageCircle, DollarSign, TrendingUp, Eye,
  ChevronRight, Loader2, X, Pencil,
} from "lucide-react";
import { useCurrentCreator } from "@/hooks/useCurrentCreator";
import { useMiniPay } from "@/hooks/useMiniPay";
import { useVeildContracts } from "@/hooks/useVeildContracts";
import { useTipEarnings } from "@/hooks/useTips";
import { useVeildTips } from "@/hooks/useTips";
import { useSubEarnings, useSubscriberCount } from "@/hooks/useSubscriptions";
import { useVeildSubscriptions } from "@/hooks/useSubscriptions";
import { RegisterForm } from "@/components/creator/register-form";
import { EditProfileModal } from "@/components/creator/edit-profile-modal";
import { ManageTiers } from "@/components/creator/manage-tiers";
import { CreatePoolForm } from "@/components/creator/create-pool-form";
import { BottomNav } from "@/components/bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatCELO, formatNumber } from "@/lib/utils";
import { CreatorAvatar } from "@/components/creator/creator-avatar";
import { VEILD_APP_DOMAIN } from "@/constants/config";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

export default function ProfilePage() {
  const { isConnected, connectWallet, isConnecting } = useMiniPay();
  const {
    address: creatorAddr,
    profile, stats, earnings, wallPosts, isLoading, isRegistered, refetch,
  } = useCurrentCreator();
  const { claimEarnings, isPending: claimPending, isConfirmed: claimDone } =
    useVeildContracts();

  const { data: tipEarnings = 0n }    = useTipEarnings(isRegistered ? creatorAddr : undefined);
  const { data: subEarnings = 0n }    = useSubEarnings(isRegistered ? creatorAddr : undefined);
  const { data: subscriberCount = 0n } = useSubscriberCount(isRegistered ? creatorAddr : undefined);
  const { claimTipEarnings, isPending: tipClaimPending, isConfirmed: tipClaimDone } = useVeildTips();
  const { claimSubEarnings, isPending: subClaimPending, isConfirmed: subClaimDone } = useVeildSubscriptions();

  const [showRegister, setShowRegister] = useState(false);
  const [showEdit, setShowEdit]         = useState(false);

  const profileUrl = profile?.username
    ? `${VEILD_APP_DOMAIN}/${profile.username}`
    : "";

  const { copied, copy } = useCopyToClipboard();

  const copyLink = useCallback(() => {
    if (profileUrl) copy(`https://${profileUrl}`);
  }, [profileUrl, copy]);

  const handleCloseRegister = useCallback(() => setShowRegister(false), []);
  const handleRegisterSuccess = useCallback(() => {
    setShowRegister(false);
    refetch();
  }, [refetch]);
  const handleCloseEdit = useCallback(() => setShowEdit(false), []);

  // ── Not connected ─────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-24 flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <MessageCircle
            className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4"
            aria-hidden="true"
          />
          <h1 className="font-bold text-xl mb-2">Your Profile</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Connect your wallet to view or create your creator profile.
          </p>
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-6 py-3 rounded-full transition-all disabled:opacity-60 mx-auto"
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : null}
            {isConnecting ? "Connecting…" : "Connect Wallet"}
          </button>
        </motion.div>
        <BottomNav />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 animate-pulse">
        <div className="border-b border-border h-14" aria-hidden="true" />
        <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">
          <div className="bg-card rounded-2xl h-48" />
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-card rounded-2xl h-24" />
            <div className="bg-card rounded-2xl h-24" />
          </div>
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
          <h1 className="font-bold text-base">Profile</h1>
          <div className="flex items-center gap-2">
            {isRegistered && profile?.username && (
              <Link
                href={`/${profile.username}`}
                className="flex items-center gap-1 text-xs text-primary border border-primary/25 px-2.5 py-1 rounded-full hover:border-primary/40 transition-colors"
                aria-label="View your fan-facing profile page"
              >
                Fan view <ExternalLink className="w-2.5 h-2.5" aria-hidden="true" />
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">
        {/* NOT REGISTERED */}
        {!isRegistered && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-b from-primary/10 to-card border border-primary/20 rounded-2xl p-6 text-center"
          >
            <MessageCircle
              className="w-10 h-10 text-primary/40 mx-auto mb-3"
              aria-hidden="true"
            />
            <h2 className="font-bold text-base mb-2">Become a creator</h2>
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
              Register on-chain to get your personal Veild link and start
              receiving anonymous messages.
            </p>
            <button
              onClick={() => setShowRegister(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-full transition-all"
            >
              Create my profile
            </button>
          </motion.div>
        )}

        {/* PROFILE CARD */}
        {isRegistered && profile && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <div
              className="h-20 bg-gradient-to-br from-primary/30 via-primary/10 to-card"
              aria-hidden="true"
            />
            <div className="px-4 pb-4 -mt-8">
              <div className="flex items-end justify-between mb-3">
                <div className="ring-4 ring-card shrink-0">
                  <CreatorAvatar
                    avatarCID={profile.avatarCID}
                    name={profile.name}
                    size="lg"
                  />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => setShowEdit(true)}
                    aria-label="Edit your profile"
                    className="flex items-center gap-1.5 text-xs font-medium border border-border bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Pencil className="w-3 h-3" aria-hidden="true" /> Edit
                  </button>
                  {profileUrl && (
                    <button
                      onClick={copyLink}
                      aria-label={copied ? "Link copied" : "Copy your Veild link"}
                      className="flex items-center gap-1.5 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-full transition-colors"
                    >
                      {copied ? (
                        <><Check className="w-3 h-3" aria-hidden="true" /> Copied!</>
                      ) : (
                        <><Copy className="w-3 h-3" aria-hidden="true" /> Copy link</>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h2 className="font-bold text-base leading-tight">{profile.name}</h2>
                {profile.isVerified && (
                  <span className="text-[10px] font-semibold bg-primary/15 text-primary border border-primary/25 px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <p className="text-muted-foreground text-xs">@{profile.username}</p>
                {profile.category && (
                  <>
                    <span className="text-muted-foreground/40 text-xs" aria-hidden="true">·</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                      {profile.category}
                    </span>
                  </>
                )}
              </div>

              {profile.bio && (
                <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                  {profile.bio}
                </p>
              )}

              {profileUrl && (
                <div className="flex items-center gap-1 bg-background border border-border rounded-xl px-3 py-2">
                  <span className="text-muted-foreground text-xs font-mono flex-1 truncate">
                    {profileUrl}
                  </span>
                  <Share2 className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STATS GRID */}
        {isRegistered && (
          <motion.dl
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06 }}
            className="grid grid-cols-2 gap-2"
            aria-label="Creator statistics"
          >
            {[
              {
                icon: MessageCircle,
                label: "Messages",
                value: stats ? formatNumber(stats.total) : "0",
                iconClass: "text-primary",
                bgClass: "bg-primary/10",
              },
              {
                icon: DollarSign,
                label: "Earned",
                value: `${formatCELO(earnings)} CELO`,
                iconClass: "text-green-400",
                bgClass: "bg-green-500/10",
              },
              {
                icon: TrendingUp,
                label: "Published",
                value: stats ? formatNumber(stats.publishedCount) : "0",
                iconClass: "text-amber-400",
                bgClass: "bg-amber-400/10",
              },
              {
                icon: Eye,
                label: "Unread",
                value: stats ? formatNumber(stats.unread) : "0",
                iconClass: "text-blue-400",
                bgClass: "bg-blue-500/10",
              },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
                <div
                  className={`w-8 h-8 ${s.bgClass} rounded-xl flex items-center justify-center mb-3`}
                  aria-hidden="true"
                >
                  <s.icon className={`w-4 h-4 ${s.iconClass}`} />
                </div>
                <dd className="font-bold text-base leading-none">{s.value}</dd>
                <dt className="text-muted-foreground text-xs mt-0.5">{s.label}</dt>
              </div>
            ))}
          </motion.dl>
        )}

        {/* TIPS & SUBSCRIPTIONS STATS */}
        {isRegistered && (tipEarnings > 0n || subEarnings > 0n || subscriberCount > 0n) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="grid grid-cols-3 gap-2"
            aria-label="Tips and subscriptions"
          >
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="w-8 h-8 bg-pink-500/10 rounded-xl flex items-center justify-center mb-3" aria-hidden="true">
                <DollarSign className="w-4 h-4 text-pink-400" />
              </div>
              <p className="font-bold text-sm leading-none">{formatCELO(tipEarnings)}</p>
              <p className="text-muted-foreground text-xs mt-0.5">Tip earnings</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="w-8 h-8 bg-violet-500/10 rounded-xl flex items-center justify-center mb-3" aria-hidden="true">
                <DollarSign className="w-4 h-4 text-violet-400" />
              </div>
              <p className="font-bold text-sm leading-none">{formatCELO(subEarnings)}</p>
              <p className="text-muted-foreground text-xs mt-0.5">Sub earnings</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="w-8 h-8 bg-violet-500/10 rounded-xl flex items-center justify-center mb-3" aria-hidden="true">
                <TrendingUp className="w-4 h-4 text-violet-400" />
              </div>
              <p className="font-bold text-sm leading-none">{formatNumber(subscriberCount)}</p>
              <p className="text-muted-foreground text-xs mt-0.5">Subscribers</p>
            </div>
          </motion.div>
        )}

        {/* CLAIM EARNINGS */}
        {isRegistered && (earnings > 0n || tipEarnings > 0n || subEarnings > 0n) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            {earnings > 0n && (
              <button
                onClick={claimEarnings}
                disabled={claimPending || claimDone}
                aria-busy={claimPending}
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-500/10 border border-green-500/25 text-green-300 text-sm font-medium rounded-xl hover:bg-green-500/15 transition-all disabled:opacity-60"
              >
                {claimPending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
                {claimDone ? "Claimed!" : `Claim ${formatCELO(earnings)} CELO (messages)`}
              </button>
            )}
            {tipEarnings > 0n && (
              <button
                onClick={claimTipEarnings}
                disabled={tipClaimPending || tipClaimDone}
                aria-busy={tipClaimPending}
                className="w-full flex items-center justify-center gap-2 py-3 bg-pink-500/10 border border-pink-500/25 text-pink-300 text-sm font-medium rounded-xl hover:bg-pink-500/15 transition-all disabled:opacity-60"
              >
                {tipClaimPending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
                {tipClaimDone ? "Claimed!" : `Claim ${formatCELO(tipEarnings)} CELO (tips)`}
              </button>
            )}
            {subEarnings > 0n && (
              <button
                onClick={claimSubEarnings}
                disabled={subClaimPending || subClaimDone}
                aria-busy={subClaimPending}
                className="w-full flex items-center justify-center gap-2 py-3 bg-violet-500/10 border border-violet-500/25 text-violet-300 text-sm font-medium rounded-xl hover:bg-violet-500/15 transition-all disabled:opacity-60"
              >
                {subClaimPending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
                {subClaimDone ? "Claimed!" : `Claim ${formatCELO(subEarnings)} CELO (subscriptions)`}
              </button>
            )}
          </motion.div>
        )}

        {/* WALL PREVIEW */}
        {isRegistered && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12 }}
            aria-label="Your public wall"
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <h2 className="text-sm font-semibold">Your wall</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {wallPosts.length} published
                </span>
              </div>
              {profile?.username && (
                <Link
                  href={`/${profile.username}/wall`}
                  className="text-xs text-primary flex items-center gap-0.5 hover:text-primary/80 transition-colors"
                  aria-label="View your full public wall"
                >
                  View <ChevronRight className="w-3 h-3" aria-hidden="true" />
                </Link>
              )}
            </div>
            {wallPosts.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground text-sm">
                No published Q&amp;As yet.
              </p>
            ) : (
              <ul className="divide-y divide-border" aria-label="Recent wall posts">
                {wallPosts.slice(0, 3).map((p) => (
                  <li key={p.id.toString()} className="px-4 py-3">
                    <p className="text-muted-foreground text-xs leading-relaxed line-clamp-1 mb-1">
                      Q: {p.question}
                    </p>
                    <p className="text-foreground text-xs leading-relaxed line-clamp-1">
                      A: {p.answer}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </motion.section>
        )}

        {/* MANAGE SUBSCRIPTION TIERS */}
        {isRegistered && creatorAddr && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.16 }}
          >
            <ManageTiers creatorAddress={creatorAddr} />
          </motion.div>
        )}

        {/* CREATE POOL */}
        {isRegistered && creatorAddr && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.18 }}
          >
            <CreatePoolForm creatorAddress={creatorAddr} />
          </motion.div>
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {isRegistered && profile && (
        <EditProfileModal
          profile={profile}
          open={showEdit}
          onClose={handleCloseEdit}
          onSaved={refetch}
        />
      )}

      {/* REGISTRATION MODAL */}
      <AnimatePresence>
        {showRegister && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && handleCloseRegister()}
            role="dialog"
            aria-modal="true"
            aria-label="Create your Veild profile"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full bg-card border-t border-border rounded-t-3xl p-5 pb-10 max-h-[90vh] overflow-y-auto"
            >
              <div
                className="w-10 h-1 bg-border rounded-full mx-auto mb-5"
                aria-hidden="true"
              />
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-base">Create your Veild</h2>
                <button
                  type="button"
                  onClick={handleCloseRegister}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  aria-label="Close registration form"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
              <RegisterForm onSuccess={handleRegisterSuccess} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
