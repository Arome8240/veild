"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { BottomNav } from "@/components/bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { useOnboarding } from "@/hooks/useOnboarding";

export default function SettingsPage() {
  const { address, isConnected } = useAccount();
  const { reset: resetOnboarding } = useOnboarding();

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur px-4 py-3">
        <h1 className="text-lg font-bold">Settings</h1>
      </header>

      <div className="px-4 py-4 space-y-2">
        {/* Account */}
        <section className="space-y-1">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Account</p>
          <div className="rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm">Wallet</span>
              <span className="font-mono text-xs text-zinc-500">
                {isConnected && address
                  ? `${address.slice(0, 6)}…${address.slice(-4)}`
                  : "Not connected"}
              </span>
            </div>
            <Link href="/profile" className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
              <span className="text-sm">Edit Profile</span>
              <span className="text-zinc-500">›</span>
            </Link>
          </div>
        </section>

        {/* Appearance */}
        <section className="space-y-1 pt-2">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Appearance</p>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </section>

        {/* Navigation links */}
        <section className="space-y-1 pt-2">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Features</p>
          <div className="rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5">
            {[
              { label: "Governance", href: "/governance" },
              { label: "Auctions",   href: "/auctions"   },
              { label: "Staking",    href: "/staking"    },
              { label: "Referrals",  href: "/referral"   },
              { label: "Analytics",  href: "/analytics"  },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <span className="text-sm">{label}</span>
                <span className="text-zinc-500">›</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Onboarding reset */}
        <section className="space-y-1 pt-2">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Help</p>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={resetOnboarding}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left"
            >
              <span className="text-sm">Replay Onboarding</span>
              <span className="text-zinc-500">↺</span>
            </button>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
