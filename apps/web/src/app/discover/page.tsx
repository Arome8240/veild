"use client";

import { useState } from "react";
import { useReadContract } from "wagmi";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/bottom-nav";
import { veildRegistry } from "@/lib/contracts";

const CATEGORIES = ["All", "Music", "Art", "Gaming", "Education", "Tech", "Lifestyle"];

export default function DiscoverPage() {
  const [category, setCategory] = useState("All");

  const totalResult = useReadContract({
    ...veildRegistry.celo,
    functionName: "totalCreators",
    args: [],
  });

  const total = (totalResult.data as bigint | undefined) ?? 0n;

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur px-4 py-3 space-y-3">
        <h1 className="text-lg font-bold">Discover</h1>
        <SearchBar />
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Category pills */}
        <div
          role="group"
          aria-label="Filter by category"
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        >
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                category === c
                  ? "bg-white text-black"
                  : "border border-white/10 text-zinc-400 hover:bg-white/5"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Stats banner */}
        <div
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between"
          aria-label={`${total.toString()} creators on Veild`}
        >
          <span className="text-sm text-zinc-400" aria-hidden="true">Creators on Veild</span>
          <span className="font-bold text-lg" aria-hidden="true">{total.toString()}</span>
        </div>

        <p className="text-sm text-zinc-500 text-center py-8">
          Search for a creator by username above, or browse upcoming features.
        </p>
      </div>

      <BottomNav />
    </main>
  );
}
