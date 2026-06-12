"use client";

import { useAccount } from "wagmi";
import { BottomNav } from "@/components/bottom-nav";
import { ReferralCard } from "@/components/ReferralCard";
import { useVeildReferral } from "@/hooks/useReferral";
import { ShareSheet } from "@/components/ShareSheet";

export default function ReferralPage() {
  const { address }         = useAccount();
  const { claimReward }     = useVeildReferral();
  const referralLink        = address
    ? `https://veild.app/r/${address}`
    : "https://veild.app/r/your-address";

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur px-4 py-3">
        <h1 className="text-lg font-bold">Referrals</h1>
        <p className="text-xs text-zinc-500">Earn 0.001 CELO per referred creator</p>
      </header>

      <div className="px-4 py-6 space-y-4">
        <p className="text-sm text-zinc-400">
          Share your referral link with creators you know. Every time someone registers
          with your link you earn 0.001 CELO — funded by the referral pool.
        </p>

        <ShareSheet url={referralLink} title="Join me on Veild" />

        {address ? (
          <ReferralCard referrer={address} onClaim={claimReward} />
        ) : (
          <p className="text-center text-sm text-zinc-500 py-8">
            Connect your wallet to see your referral stats.
          </p>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
