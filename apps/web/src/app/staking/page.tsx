"use client";

import { useAccount } from "wagmi";
import { BottomNav } from "@/components/bottom-nav";
import { StakingPanel } from "@/components/StakingPanel";
import { useVeildStaking } from "@/hooks/useStaking";

export default function StakingPage() {
  const { address } = useAccount();
  const { stake, requestWithdraw, withdraw } = useVeildStaking();

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur px-4 py-3">
        <h1 className="text-lg font-bold">Staking</h1>
        <p className="text-xs text-zinc-500">Boost your discoverability with staked CELO</p>
      </header>

      <div className="px-4 py-6 space-y-4">
        <p className="text-sm text-zinc-400">
          Stake CELO to increase your discoverability boost score. Higher staked amounts
          surface your profile higher in search and discovery. Withdrawals have a 7-day
          cooldown period.
        </p>

        {address ? (
          <StakingPanel
            creator={address}
            onStake={stake}
            onRequestWithdraw={requestWithdraw}
            onWithdraw={withdraw}
          />
        ) : (
          <p className="text-center text-sm text-zinc-500 py-8">
            Connect your wallet to manage staking.
          </p>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
