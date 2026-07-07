"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Eye, ArrowLeft, Wallet, UserCircle, Share2,
  MessagesSquare, Coins, Lock, Landmark, Trophy,
  Users, Ticket, Gift, ChevronRight, Zap, ShieldCheck,
  BadgeCheck, TrendingUp, Lightbulb, HelpCircle,
} from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
      {children}
    </p>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-surface-1 border border-white/5 rounded-2xl p-4 ${className}`}>
      {children}
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/8 border border-white/8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400" />
          </Link>
          <span className="font-semibold text-sm">Guide &amp; Tips</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4">
        {/* HERO */}
        <motion.div {...fade(0)} className="pt-8 pb-10 text-center">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Eye className="w-7 h-7 text-violet-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">How Veild Works</h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto">
            A complete walkthrough of every feature — from setting up your profile to earning on-chain.
          </p>
        </motion.div>

        {/* ── GETTING STARTED ───────────────────────────────────────────── */}
        <motion.section {...fade(0.05)} className="mb-10">
          <SectionLabel>Getting started</SectionLabel>
          <div className="space-y-3">
            {[
              {
                Icon: Wallet,
                step: "01",
                title: "Connect your wallet",
                body: "Veild runs on the CELO blockchain. Open the app inside MiniPay (the easiest option — no setup needed) or connect any EVM-compatible wallet like MetaMask or Valora. Your wallet address is your identity on-chain.",
              },
              {
                Icon: UserCircle,
                step: "02",
                title: "Create your creator profile",
                body: "Head to Settings → Profile to pick a username, upload an avatar, and write a bio. Your username becomes your permanent link: veild.vercel.app/username. You only need to do this once — it's stored on-chain.",
              },
              {
                Icon: Share2,
                step: "03",
                title: "Share your Veild link",
                body: "Copy your link from the home screen and post it on X, Instagram, YouTube, or anywhere your audience is. Anyone — even without a wallet — can open your link to send you an anonymous message or a tip.",
              },
            ].map(({ Icon, step, title, body }, i) => (
              <motion.div key={step} {...fade(0.1 + i * 0.06)}>
                <Card>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-violet-500 font-bold text-[10px] font-mono">{step}</span>
                        <p className="font-semibold text-sm">{title}</p>
                      </div>
                      <p className="text-zinc-400 text-xs leading-relaxed">{body}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── FEATURES ──────────────────────────────────────────────────── */}
        <motion.section {...fade(0.25)} className="mb-10">
          <SectionLabel>Features explained</SectionLabel>
          <div className="space-y-3">

            {/* Anonymous Q&A */}
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <MessagesSquare className="w-4 h-4 text-violet-400 shrink-0" />
                <p className="font-semibold text-sm">Anonymous Q&amp;A</p>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed mb-3">
                Anyone with your link can send you a message — no wallet, no account required on their end. Messages arrive in your <strong className="text-zinc-300">Inbox</strong>. You decide which ones to reply to, and which replies to publish publicly on your <strong className="text-zinc-300">Wall</strong>.
              </p>
              <div className="bg-background border border-white/5 rounded-xl px-3 py-2.5 space-y-1.5">
                <Tip icon={ShieldCheck}>Senders are fully anonymous — you only see the message, not who sent it.</Tip>
                <Tip icon={Zap}>Reply to messages directly from your inbox and optionally publish the Q&amp;A to your wall.</Tip>
                <Tip icon={BadgeCheck}>Published Q&amp;As build social proof and keep your wall active.</Tip>
              </div>
            </Card>

            {/* Tips */}
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-4 h-4 text-violet-400 shrink-0" />
                <p className="font-semibold text-sm">Tips (CELO)</p>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed mb-3">
                Fans can attach a CELO tip to any message they send. The funds go directly to your wallet — no platform fee, no middleman. Tips settle on-chain within seconds. You can see your total earnings on your home screen.
              </p>
              <div className="bg-background border border-white/5 rounded-xl px-3 py-2.5 space-y-1.5">
                <Tip icon={Zap}>CELO is the native token of the Celo network — fast, cheap, and mobile-friendly.</Tip>
                <Tip icon={TrendingUp}>Earnings accumulate in your connected wallet in real time.</Tip>
                <Tip icon={Lightbulb}>Mention tipping in your bio or posts to encourage fans to support you.</Tip>
              </div>
            </Card>

            {/* Subscriptions */}
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-violet-400 shrink-0" />
                <p className="font-semibold text-sm">Subscriptions</p>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed mb-3">
                Create up to three subscription tiers from your profile settings — each with a monthly CELO price and a short description of perks. Subscribers unlock exclusive access: priority replies, gated content, or any benefit you define. Payments are handled automatically on-chain.
              </p>
              <div className="bg-background border border-white/5 rounded-xl px-3 py-2.5 space-y-1.5">
                <Tip icon={Lightbulb}>Start with one tier (e.g. &ldquo;Supporter — 1 CELO/month&rdquo;) to keep it simple.</Tip>
                <Tip icon={BadgeCheck}>Be specific about perks — &ldquo;reply within 24 h&rdquo; converts better than vague descriptions.</Tip>
                <Tip icon={TrendingUp}>Subscriptions give you predictable recurring income vs. one-off tips.</Tip>
              </div>
            </Card>

            {/* Gifts */}
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-violet-400 shrink-0" />
                <p className="font-semibold text-sm">Gifts</p>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Fans can send themed virtual gifts alongside their messages — each gift has a fixed CELO value and shows on the message in your inbox. Gifts are a fun, expressive alternative to plain tips and appear as collectibles on your profile.
              </p>
            </Card>

            {/* Pools */}
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-violet-400 shrink-0" />
                <p className="font-semibold text-sm">Pools (Crowdfunding)</p>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed mb-3">
                Create a funding pool for a specific goal — a project, event, or campaign. Set a target CELO amount and deadline. Your community contributes directly. If the goal is met, funds are released to you. Pools are fully transparent on-chain.
              </p>
              <div className="bg-background border border-white/5 rounded-xl px-3 py-2.5 space-y-1.5">
                <Tip icon={Lightbulb}>Use pools for one-time projects rather than ongoing income (that&apos;s what subscriptions are for).</Tip>
                <Tip icon={Zap}>Share your pool link as soon as it goes live to build early momentum.</Tip>
              </div>
            </Card>

            {/* Auctions */}
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="w-4 h-4 text-violet-400 shrink-0" />
                <p className="font-semibold text-sm">Auctions</p>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                List exclusive items or experiences for auction — a 1-on-1 call, a custom shoutout, a signed NFT. Bidding is on-chain and the highest bidder at closing time wins. The CELO bid amount is sent directly to your wallet.
              </p>
            </Card>

            {/* Governance & Staking */}
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <Landmark className="w-4 h-4 text-violet-400 shrink-0" />
                <p className="font-semibold text-sm">Governance &amp; Staking</p>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed mb-3">
                Stake CELO to earn voting power. Submit or vote on proposals that shape how the platform evolves — fee changes, new features, policy updates. Staked CELO earns yield while it participates in governance.
              </p>
              <div className="bg-background border border-white/5 rounded-xl px-3 py-2.5 space-y-1.5">
                <Tip icon={ShieldCheck}>Your voting weight is proportional to your staked amount — more stake, more influence.</Tip>
                <Tip icon={TrendingUp}>Staking rewards compound over time — check the Staking tab for current APY.</Tip>
              </div>
            </Card>

            {/* Leaderboard */}
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-violet-400 shrink-0" />
                <p className="font-semibold text-sm">Leaderboard &amp; Discovery</p>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                The Discover tab surfaces trending creators and lets anyone search by username or category. The Leaderboard ranks creators by tips earned, messages received, and subscriber count. Being active and replying to messages helps you rank higher.
              </p>
            </Card>

          </div>
        </motion.section>

        {/* ── TIPS FOR CREATORS ─────────────────────────────────────────── */}
        <motion.section {...fade(0.35)} className="mb-10">
          <SectionLabel>Tips for creators</SectionLabel>
          <Card>
            <ul className="space-y-3">
              {[
                { Icon: Share2,     text: "Post your Veild link in every bio — X, Instagram, TikTok, YouTube About section." },
                { Icon: Zap,        text: "Reply to messages consistently. Active creators rank higher and attract more fans." },
                { Icon: BadgeCheck, text: "Publish your best Q&As to your wall — it acts as a public FAQ and builds trust." },
                { Icon: Lightbulb,  text: "Announce your subscription tiers with a post explaining exactly what subscribers get." },
                { Icon: TrendingUp, text: "Use pools for goals your audience cares about — community-funded projects feel personal." },
                { Icon: Trophy,     text: "Check the Leaderboard weekly to benchmark your growth against other creators." },
              ].map(({ Icon, text }, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Icon className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                  <p className="text-zinc-400 text-xs leading-relaxed">{text}</p>
                </li>
              ))}
            </ul>
          </Card>
        </motion.section>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <motion.section {...fade(0.45)} className="mb-10">
          <SectionLabel>Common questions</SectionLabel>
          <div className="space-y-3">
            {[
              {
                q: "Do senders need a wallet?",
                a: "No. Anyone can open your link and send a plain anonymous message without a wallet. A wallet is only required if they want to attach a CELO tip or gift.",
              },
              {
                q: "Are messages really anonymous?",
                a: "Yes. The platform records only the message content on-chain. There is no link between the message and the sender's wallet address or any identifying data.",
              },
              {
                q: "How do I withdraw my earnings?",
                a: "Your tips and subscription payments land directly in your connected wallet — there is nothing to withdraw. Open your wallet app (e.g. MiniPay) to send or convert your CELO.",
              },
              {
                q: "What network does Veild run on?",
                a: "Veild is built on the Celo blockchain — a mobile-first EVM-compatible chain with fast, near-zero-fee transactions. MiniPay is the recommended wallet for the best experience.",
              },
              {
                q: "Is my profile stored on-chain?",
                a: "Your username, bio, and avatar are stored on-chain via the Veild smart contracts on Celo. This means your profile is permanent, censorship-resistant, and owned by you.",
              },
            ].map(({ q, a }, i) => (
              <motion.div key={i} {...fade(0.5 + i * 0.05)}>
                <Card>
                  <div className="flex items-start gap-2.5">
                    <HelpCircle className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm mb-1">{q}</p>
                      <p className="text-zinc-400 text-xs leading-relaxed">{a}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div {...fade(0.6)} className="mb-6 text-center">
          <p className="text-zinc-500 text-xs mb-4">Ready to get started?</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold px-6 py-3 rounded-full transition-all"
          >
            Back to home <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}

function Tip({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3 h-3 text-violet-500 shrink-0 mt-0.5" />
      <p className="text-zinc-500 text-[11px] leading-relaxed">{children}</p>
    </div>
  );
}
