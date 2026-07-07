import Link from "next/link";
import { Eye, MessagesSquare, Coins, Lock, Landmark, Link2, Lightbulb, ChevronRight } from "lucide-react";

const features = [
  { Icon: MessagesSquare, title: "Anonymous Q&A", desc: "Ask anything without revealing your identity." },
  { Icon: Coins,          title: "Tip with CELO",  desc: "Send crypto tips directly on-chain." },
  { Icon: Lock,           title: "Subscribe",       desc: "Unlock exclusive content from creators." },
  { Icon: Landmark,       title: "Governance",      desc: "Vote on platform decisions with your stake." },
];

const steps = [
  { step: "01", title: "Connect your wallet",  desc: "Link your CELO wallet or open in MiniPay." },
  { step: "02", title: "Create your profile",  desc: "Get a personalized link — share it anywhere." },
  { step: "03", title: "Start earning",         desc: "Receive tips, messages, and subscriptions on-chain." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-base tracking-tight flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-violet-400" /> veild
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/guide"
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1"
            >
              Guide
            </Link>
            <Link
              href="/home"
              className="flex items-center gap-1.5 bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold px-4 py-2 rounded-full transition-all"
            >
              Launch app
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-lg mx-auto px-4 pt-16 pb-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Eye className="w-8 h-8 text-violet-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold leading-tight mb-4 tracking-tight">
          The on-chain<br />
          <span className="text-violet-400">creator economy</span>
        </h1>
        <p className="text-zinc-400 text-base leading-relaxed mb-8">
          Tip, subscribe, and send anonymous messages to your favorite creators — directly on CELO. No middlemen. No censorship.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/home"
            className="flex items-center justify-center gap-2 bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold px-6 py-3 rounded-full transition-all"
          >
            Get started →
          </Link>
          <Link
            href="/discover"
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/8 border border-white/10 text-zinc-300 text-sm font-medium px-6 py-3 rounded-full transition-all"
          >
            Explore creators
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-lg mx-auto px-4 pb-12">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 text-center">
          What you can do
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {features.map(({ Icon, title, desc }) => (
            <div key={title} className="bg-surface-1 border border-white/5 rounded-2xl p-4">
              <Icon className="w-5 h-5 text-violet-400 mb-3" />
              <p className="font-semibold text-sm mb-1">{title}</p>
              <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-lg mx-auto px-4 pb-12">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 text-center">
          How it works
        </h2>
        <div className="space-y-3">
          {steps.map(({ step, title, desc }) => (
            <div key={step} className="flex items-start gap-4 bg-surface-1 border border-white/5 rounded-2xl px-4 py-3.5">
              <span className="text-violet-500 font-bold text-xs font-mono shrink-0 mt-0.5">{step}</span>
              <div>
                <p className="font-semibold text-sm mb-0.5">{title}</p>
                <p className="text-zinc-500 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GUIDE CTA */}
      <section className="max-w-lg mx-auto px-4 pb-10">
        <Link
          href="/guide"
          className="flex items-center justify-between bg-surface-1 border border-violet-500/20 hover:border-violet-500/40 rounded-2xl px-4 py-4 group transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">Guide &amp; Tips</p>
              <p className="text-zinc-500 text-xs">Step-by-step walkthroughs, feature explanations &amp; FAQs</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>
      </section>

      {/* FOOTER */}
      <section className="max-w-lg mx-auto px-4 pb-16">
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-600">
          <Link2 className="w-3.5 h-3.5" />
          <span>Built on</span>
          <span className="text-zinc-400 font-semibold">CELO</span>
          <span>·</span>
          <span>Powered by MiniPay</span>
        </div>
      </section>

    </div>
  );
}
