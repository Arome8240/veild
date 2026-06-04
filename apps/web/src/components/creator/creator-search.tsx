"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Loader2, MessageCircle, ArrowRight } from "lucide-react";
import { useCreatorByUsername } from "@/hooks/useVeildContracts";
import { resolveAvatar, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const DEBOUNCE_MS = 500;

/**
 * Real-time username search backed by VeildRegistry.getCreatorByUsername.
 * Debounces the query so we don't hammer the RPC on every keystroke.
 */
export function CreatorSearch() {
  const [query, setQuery]       = useState("");
  const [debounced, setDebounced] = useState("");

  // Debounce: only fire the on-chain lookup 500ms after the user stops typing
  useEffect(() => {
    if (!query.trim()) {
      setDebounced("");
      return;
    }
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const { data: result, isLoading, isFetching } = useCreatorByUsername(
    debounced || undefined
  );

  const addr    = result?.[0];
  const creator = result?.[1];
  const found   =
    !!addr &&
    addr !== "0x0000000000000000000000000000000000000000" &&
    creator?.isActive;

  const isSearching = (isLoading || isFetching) && !!debounced;

  return (
    <section aria-label="Search for creators" className="mb-5">
      {/* Input */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <label htmlFor="creator-search" className="sr-only">
          Search creators by username
        </label>
        <input
          id="creator-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a creator by username…"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Search creators by username"
          aria-describedby={debounced ? "search-status" : undefined}
          className="w-full bg-card border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-colors"
        />
        {/* Clear / spinner */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isSearching ? (
            <Loader2
              className="w-4 h-4 text-muted-foreground animate-spin"
              aria-hidden="true"
            />
          ) : query ? (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Results */}
      {debounced && (
        <div id="search-status" aria-live="polite" aria-atomic="true">
          {isSearching ? (
            /* Loading skeleton */
            <div className="mt-2 bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted rounded-full w-28" />
                  <div className="h-2.5 bg-muted rounded-full w-20" />
                </div>
              </div>
            </div>
          ) : found && creator ? (
            /* Creator result card */
            <Link
              href={`/${creator.username}`}
              className="group mt-2 flex items-center gap-3 bg-card border border-border rounded-xl p-3.5 hover:border-primary/30 hover:bg-primary/5 transition-all"
              aria-label={`View ${creator.name}'s profile`}
            >
              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-muted shrink-0 ring-1 ring-border">
                <Image
                  src={resolveAvatar(creator.avatarCID, creator.username)}
                  alt={`${creator.name}'s avatar`}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sm text-foreground leading-tight">
                    {creator.name}
                  </span>
                  {creator.isVerified && (
                    <Badge variant="verified">Verified</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-muted-foreground text-xs">
                    @{creator.username}
                  </span>
                  {creator.category && (
                    <>
                      <span className="text-muted-foreground/40 text-xs" aria-hidden="true">·</span>
                      <span className="text-muted-foreground text-xs">{creator.category}</span>
                    </>
                  )}
                </div>
                {creator.bio && (
                  <p className="text-muted-foreground text-xs mt-1 line-clamp-1">
                    {creator.bio}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <MessageCircle className="w-3 h-3 text-muted-foreground/60" aria-hidden="true" />
                  <span className="text-muted-foreground/60 text-[10px]">
                    {formatNumber(creator.totalMessages)} messages
                  </span>
                </div>
              </div>

              <ArrowRight
                className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
                aria-hidden="true"
              />
            </Link>
          ) : (
            /* Not found */
            <p
              className="mt-2 text-center text-muted-foreground text-xs py-4 bg-card border border-border rounded-xl"
              role="status"
            >
              No creator found for{" "}
              <span className="font-medium text-foreground">@{debounced}</span>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
