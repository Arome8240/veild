"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Inbox, User } from "lucide-react";
import { useAccount } from "wagmi";
import { useInboxStats } from "@/hooks/useVeildContracts";
import type { Address } from "viem";

const tabs = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/inbox", icon: Inbox, label: "Inbox" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { address } = useAccount();
  const { data: stats } = useInboxStats(address as Address | undefined);

  const unreadCount = stats ? Number(stats.unread) : 0;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="max-w-lg mx-auto flex items-stretch">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          const badge =
            href === "/inbox" && unreadCount > 0 ? unreadCount : null;

          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 relative transition-colors"
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-violet-500 rounded-full" />
              )}
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    active ? "text-violet-400" : "text-zinc-600"
                  }`}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                {badge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-violet-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  active ? "text-violet-400" : "text-zinc-600"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
