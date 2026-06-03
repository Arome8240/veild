"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Check, Share2, ExternalLink, MessageCircle,
  DollarSign, TrendingUp, Users, Eye, ChevronRight,
  Loader2, X, Edit3,
} from "lucide-react";
import { useCurrentCreator } from "@/hooks/useCurrentCreator";
import { useMiniPay } from "@/hooks/useMiniPay";
import { useVeildContracts } from "@/hooks/useVeildContracts";
import { BottomNav } from "@/components/bottom-nav";
import { formatCELO, formatNumber, timeAgo, resolveAvatar } from "@/lib/utils";

// ─── Registration form ────────────────────────────────────────────────────────
function RegisterForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    username: "", name: "", bio: "", category: "Art & Design",
  });
  const { registerCreator, isPending, isConfirming, isConfirmed, error } = useVeildContracts();

  const categories = [
    "Art & Design","Music","Tech & Education","Gaming",
    "Fitness","Comedy","Cooking","Photography","Writing","Fashion",
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    registerCreator(form.username, form.name, form.bio, "", form.category);
  }

  if (isConfirmed) {
    return (
      <div className="text-center py-8">
        <Check className="w-12 h-12 text-green-400 mx-auto mb-3" />
        <p className="font-semibold text-green-300 mb-1">You're live on Veild!</p>
        <p className="text-zinc-500 text-sm mb-4">Your creator profile is now on-chain.</p>
        <button onClick={onClose} className="text-violet-400 text-sm hover:text-violet-300 transition-colors">
          View profile →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Username *</label>
        <input required value={form.username}
          onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 32) }))}
          placeholder="your_handle"
          className="w-full bg-[#1a1a1a] border border-white/8 focus:border-violet-500/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors"
        />
        <p className="text-[10px] text-zinc-600 mt-1">Letters, numbers, underscores — max 32 chars</p>
      </div>
      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Display name *</label>
        <input required value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Your Name"
          className="w-full bg-[#1a1a1a] border border-white/8 focus:border-violet-500/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors"
        />
      </div>
      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Bio</label>
        <textarea value={form.bio} rows={3}
          onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
          placeholder="Tell your fans about yourself…"
          className="w-full bg-[#1a1a1a] border border-white/8 focus:border-violet-500/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors resize-none"
        />
      </div>
      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Category</label>
        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          className="w-full bg-[#1a1a1a] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {error && <p className="text-xs text-red-400">{error.message?.slice(0, 80)}</p>}

      <button type="submit" disabled={!form.username || !form.name || isPending || isConfirming}
        className="w-full flex items-center justify-center gap-2 bg-violet-700 hover:bg-violet-600 disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-xl transition-all"
      >
        {isPending || isConfirming ? (
          <><Loader2 className="w-4 h-4 animate-spin" />{isPending ? "Confirm in wallet…" : "Registering…"}</>
        ) : "Create my Veild profile"}
      </button>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { address, isConnected, connectWallet, isConnecting } = useMiniPay();
  const { profile, stats, earnings, wallPosts, isLoading, isRegistered, refetch } = useCurrentCreator();
  const { claimEarnings, isPending: claimPending, isConfirmed: claimDone } = useVeildContracts();

  const [copied, setCopied]       = useState(false);
  const [showRegister, setReg]    = useState(false);

  const avatarUrl  = resolveAvatar(profile?.avatarCID ?? "", profile?.username ?? address ?? "");
  const profileUrl = profile?.username ? `veild.app/${profile.username}` : "";

  function copyLink() {
    if (navigator.clipboard && profileUrl)
      navigator.clipboard.writeText(`https://${profileUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white pb-24 flex flex-col items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="text-5xl mb-4">👤</div>
          <h1 className="font-bold text-xl mb-2">Your Profile</h1>
          <p className="text-zinc-500 text-sm mb-8">Connect your wallet to view or create your creator profile.</p>
          <button onClick={connectWallet} disabled={isConnecting}
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pb-24 animate-pulse">
        <div className="border-b border-white/5 h-14" />
        <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">
          <div className="bg-[#111] rounded-2xl h-48" />
          <div className="grid grid-cols-2 gap-2"><div className="bg-[#111] rounded-2xl h-24" /><div className="bg-[#111] rounded-2xl h-24" /></div>
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
          <h1 className="font-bold text-base">Profile</h1>
          {isRegistered && profile?.username && (
            <Link href={`/${profile.username}`}
              className="flex items-center gap-1 text-xs text-violet-400 border border-violet-500/25 px-2.5 py-1 rounded-full hover:border-violet-400/40 transition-colors"
            >
              Fan view <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">
        {/* NOT REGISTERED */}
        {!isRegistered && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-b from-violet-900/20 to-[#111] border border-violet-500/20 rounded-2xl p-6 text-center"
          >
            <div className="text-3xl mb-3">✨</div>
            <h2 className="font-bold text-base mb-2">Become a creator</h2>
            <p className="text-zinc-500 text-sm mb-4 leading-relaxed">
              Register on-chain to get your personal Veild link and start receiving anonymous messages.
            </p>
            <button onClick={() => setReg(true)}
              className="bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all"
            >
              Create my profile
            </button>
          </motion.div>
        )}

        {/* PROFILE CARD */}
        {isRegistered && profile && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden"
          >
            <div className="h-20 bg-gradient-to-br from-violet-900/60 via-purple-900/30 to-[#111]" />
            <div className="px-4 pb-4 -mt-8">
              <div className="flex items-end justify-between mb-3">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-[#111] shrink-0">
                  <Image src={avatarUrl} alt={profile.name} fill className="object-cover" />
                </div>
                {profileUrl && (
                  <button onClick={copyLink}
                    className="flex items-center gap-1.5 text-xs font-medium bg-violet-700 hover:bg-violet-600 text-white px-3 py-1.5 rounded-full transition-colors mb-1"
                  >
                    {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy link</>}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h2 className="font-bold text-base leading-tight">{profile.name}</h2>
                {profile.isVerified && (
                  <span className="text-[10px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/25 px-2 py-0.5 rounded-full">✓ Verified</span>
                )}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-zinc-500 text-xs">@{profile.username}</p>
                {profile.category && <><span className="text-zinc-700 text-xs">·</span><span className="text-xs text-zinc-600 bg-white/4 px-2 py-0.5 rounded-full border border-white/6">{profile.category}</span></>}
              </div>
              {profile.bio && <p className="text-zinc-400 text-sm leading-relaxed mb-3">{profile.bio}</p>}
              {profileUrl && (
                <div className="flex items-center gap-1 bg-[#0a0a0a] border border-white/6 rounded-xl px-3 py-2">
                  <span className="text-zinc-500 text-xs font-mono flex-1 truncate">{profileUrl}</span>
                  <Share2 className="w-3.5 h-3.5 text-zinc-600" />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STATS */}
        {isRegistered && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.06 }}
            className="grid grid-cols-2 gap-2"
          >
            {[
              { icon: MessageCircle, label: "Messages", value: stats ? formatNumber(stats.total) : "0", sub: "received", color: "text-violet-400", bg: "bg-violet-500/8" },
              { icon: DollarSign, label: "Earned", value: `${formatCELO(earnings)} CELO`, sub: "from priority", color: "text-green-400", bg: "bg-green-500/8" },
              { icon: TrendingUp, label: "Published", value: stats ? formatNumber(stats.publishedCount) : "0", sub: "on wall", color: "text-amber-400", bg: "bg-amber-400/8" },
              { icon: Eye, label: "Unread", value: stats ? formatNumber(stats.unread) : "0", sub: "messages", color: "text-blue-400", bg: "bg-blue-500/8" },
            ].map(s => (
              <div key={s.label} className="bg-[#111] border border-white/5 rounded-2xl p-4">
                <div className={`w-8 h-8 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="font-bold text-base leading-none">{s.value}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* CLAIM EARNINGS */}
        {isRegistered && earnings > 0n && (
          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => claimEarnings()} disabled={claimPending || claimDone}
            className="w-full flex items-center justify-center gap-2 py-3 bg-green-500/10 border border-green-500/25 text-green-300 text-sm font-medium rounded-xl hover:bg-green-500/15 transition-all disabled:opacity-60"
          >
            {claimPending || claimDone ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {claimDone ? "Claimed!" : `Claim ${formatCELO(earnings)} CELO`}
          </motion.button>
        )}

        {/* EARNINGS BREAKDOWN */}
        {isRegistered && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.16 }}
            className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-white/5">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold">Earnings</span>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: "Priority messages", amount: earnings * 62n / 100n },
                { label: "Tips received", amount: earnings * 28n / 100n },
                { label: "Wall engagement", amount: earnings * 10n / 100n },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <p className="text-sm text-zinc-300">{row.label}</p>
                  <span className="font-semibold text-sm text-green-400">+{formatCELO(row.amount)} CELO</span>
                </div>
              ))}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Total</span>
                <span className="font-bold text-base text-green-300">{formatCELO(earnings)} CELO</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* WALL PREVIEW */}
        {isRegistered && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 }}
            className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-zinc-500" />
                <span className="text-sm font-semibold">Your wall</span>
                <span className="text-xs text-zinc-600 bg-white/5 px-2 py-0.5 rounded-full">{wallPosts.length} published</span>
              </div>
              {profile?.username && (
                <Link href={`/${profile.username}/wall`} className="text-xs text-violet-400 flex items-center gap-0.5">
                  View <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
            {wallPosts.length === 0 ? (
              <div className="p-6 text-center text-zinc-600 text-sm">No published Q&As yet.</div>
            ) : (
              <div className="divide-y divide-white/4">
                {wallPosts.slice(0, 3).map(p => (
                  <div key={p.id.toString()} className="px-4 py-3">
                    <p className="text-zinc-400 text-xs leading-relaxed line-clamp-1 mb-1">Q: {p.question}</p>
                    <p className="text-zinc-200 text-xs leading-relaxed line-clamp-1">A: {p.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* REGISTRATION MODAL */}
      <AnimatePresence>
        {showRegister && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setReg(false)}
          >
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full bg-[#141414] border-t border-white/10 rounded-t-3xl p-5 pb-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5" />
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-base">Create your Veild</h3>
                <button onClick={() => setReg(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <RegisterForm onClose={() => { setReg(false); refetch(); }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
