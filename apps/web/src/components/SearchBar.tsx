"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/hooks/useSearch";
import type { Creator } from "@/lib/contracts";

interface Props {
  onSelect?: (creator: Creator) => void;
}

export function SearchBar({ onSelect }: Props) {
  const [query, setQuery]     = useState("");
  const { results, isLoading } = useSearch(query);
  const router                 = useRouter();

  const handleSelect = (c: Creator) => {
    if (onSelect) {
      onSelect(c);
    } else {
      router.push(`/creator/${c.username}`);
    }
    setQuery("");
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <svg className="h-4 w-4 shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search creators…"
          className="flex-1 bg-transparent text-sm placeholder-zinc-600 focus:outline-none"
        />
        {isLoading && (
          <span className="h-3 w-3 animate-spin rounded-full border border-white/20 border-t-white" />
        )}
      </div>

      {query.length >= 2 && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-white/10 bg-zinc-900 py-1 shadow-xl">
          {results.map((c) => (
            <li key={c.username}>
              <button
                onClick={() => handleSelect(c)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/5 transition-colors"
              >
                <div className="h-7 w-7 shrink-0 rounded-full bg-white/10 overflow-hidden">
                  {c.avatarCID && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`https://ipfs.io/ipfs/${c.avatarCID}`} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-zinc-500">@{c.username}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.length >= 2 && !isLoading && results.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-white/10 bg-zinc-900 p-3 text-center text-sm text-zinc-500 shadow-xl">
          No creator found
        </div>
      )}
    </div>
  );
}
