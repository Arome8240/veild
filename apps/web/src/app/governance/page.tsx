"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { BottomNav } from "@/components/bottom-nav";
import { ProposalCard } from "@/components/ProposalCard";
import { useProposalCount, useVeildGovernance } from "@/hooks/useGovernance";

export default function GovernancePage() {
  const { address } = useAccount();
  const { data: countRaw } = useProposalCount();
  const count = Number(countRaw ?? 0n);

  const [title, setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const { createProposal, castVote, isPending } = useVeildGovernance();

  const handleCreate = useCallback(async () => {
    if (!title.trim() || !description.trim()) return;
    await createProposal(title, description);
    setTitle("");
    setDescription("");
  }, [title, description, createProposal]);

  const handleVote = useCallback((proposalId: bigint, support: boolean) => {
    castVote(proposalId, support);
  }, [castVote]);

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur px-4 py-3">
        <h1 className="text-lg font-bold">Governance</h1>
        <p className="text-xs text-zinc-500">{count} proposal{count !== 1 ? "s" : ""}</p>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Create proposal */}
        {address && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <h2 className="text-sm font-semibold">New Proposal</h2>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (max 100 chars)"
              aria-label="Proposal title"
              maxLength={100}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (max 500 chars)"
              aria-label="Proposal description"
              maxLength={500}
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={isPending || !title.trim() || !description.trim()}
              aria-busy={isPending}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-40 transition-colors"
            >
              {isPending ? "Submitting…" : "Submit Proposal"}
            </button>
          </div>
        )}

        {/* Proposal list */}
        <div className="space-y-3">
          {count === 0 ? (
            <p className="text-center text-sm text-zinc-500 py-8">No proposals yet.</p>
          ) : (
            Array.from({ length: count }, (_, i) => BigInt(i + 1)).reverse().map((id) => (
              <ProposalCard
                key={id.toString()}
                proposalId={id}
                voter={address}
                onVote={handleVote}
              />
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
