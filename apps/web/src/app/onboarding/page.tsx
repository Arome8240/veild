"use client";

import { useRouter } from "next/navigation";
import { useOnboarding, type OnboardingStep } from "@/hooks/useOnboarding";

const STEPS: { key: OnboardingStep; emoji: string; title: string; body: string }[] = [
  { key: "welcome",  emoji: "👋", title: "Welcome to Veild",    body: "The on-chain creator economy, powered by CELO." },
  { key: "wallet",   emoji: "🔐", title: "Connect Your Wallet", body: "Non-custodial. Your keys, your content, your earnings." },
  { key: "explore",  emoji: "🔭", title: "Discover Creators",   body: "Follow creators, tip them, and subscribe — all on-chain." },
  { key: "send",     emoji: "💸", title: "Send Your First Tip",  body: "97% goes directly to the creator. Instant, no middlemen." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { step, currentIndex, totalSteps, next, skip } = useOnboarding();

  const current = STEPS.find((s) => s.key === step);

  if (step === "done" || !current) {
    router.replace("/");
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <p className="text-6xl">{current.emoji}</p>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{current.title}</h1>
          <p className="text-zinc-400">{current.body}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              className={`h-1.5 rounded-full transition-all ${
                i === currentIndex ? "w-5 bg-white" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={skip}
            className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-zinc-500 hover:bg-white/5 transition-colors"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={next}
            className="flex-1 rounded-xl bg-white py-3 text-sm font-semibold text-black hover:bg-white/90 transition-colors"
          >
            {currentIndex === totalSteps - 1 ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    </main>
  );
}
