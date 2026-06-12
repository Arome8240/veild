"use client";

import { useOnboarding, type OnboardingStep } from "@/hooks/useOnboarding";

const STEPS: { key: OnboardingStep; title: string; body: string; emoji: string }[] = [
  { key: "welcome",  emoji: "👋", title: "Welcome to Veild",     body: "The on-chain creator platform powered by CELO. Connect your wallet to get started."         },
  { key: "wallet",   emoji: "🔐", title: "Connect Your Wallet",  body: "Veild is non-custodial. Your keys, your content. Use any EVM-compatible wallet."           },
  { key: "explore",  emoji: "🔭", title: "Discover Creators",    body: "Browse the leaderboard, follow creators, and send tips directly on-chain."                  },
  { key: "send",     emoji: "💸", title: "Send Your First Tip",   body: "Find a creator you love and tip them in CELO. 97% goes directly to them."                   },
];

export function OnboardingModal() {
  const { step, currentIndex, totalSteps, isComplete, next, skip } = useOnboarding();

  if (isComplete || step === "done") return null;

  const current = STEPS.find((s) => s.key === step) ?? STEPS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6 space-y-5 shadow-2xl">
        <div className="text-center space-y-2">
          <p className="text-4xl">{current.emoji}</p>
          <h2 className="text-xl font-bold">{current.title}</h2>
          <p className="text-sm text-zinc-400">{current.body}</p>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              className={`h-1.5 rounded-full transition-all ${
                i === currentIndex ? "w-4 bg-white" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={skip}
            className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-zinc-500 hover:bg-white/5 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={next}
            className="flex-1 rounded-xl bg-white py-2.5 text-sm font-medium text-black hover:bg-white/90 transition-colors"
          >
            {currentIndex === totalSteps - 1 ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
