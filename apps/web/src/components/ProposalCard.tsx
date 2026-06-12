"use client";

import { type Address } from "viem";
import { useProposal, useProposalState, useVoteTotals, useHasVoted } from "@/hooks/useGovernance";
import type { ProposalState } from "@/lib/contracts";

const STATE_LABELS: Record<number, string> = {
  0: "Active",
  1: "Passed",
  2: "Defeated",
  3: "Cancelled",
  4: "Executed",
};

const STATE_COLORS: Record<number, string> = {
  0: "text-blue-400 bg-blue-400/10",
  1: "text-green-400 bg-green-400/10",
  2: "text-red-400 bg-red-400/10",
  3: "text-zinc-400 bg-zinc-400/10",
  4: "text-purple-400 bg-purple-400/10",
};

interface Props {
  proposalId: bigint;
  voter?:     Address;
  onVote?:    (proposalId: bigint, support: boolean) => void;
}

export function ProposalCard({ proposalId, voter, onVote }: Props) {
  const { data: proposal }     = useProposal(proposalId);
  const { data: stateRaw }     = useProposalState(proposalId);
  const { forVotes, againstVotes } = useVoteTotals(proposalId);
  const { data: hasVoted }     = useHasVoted(proposalId, voter);

  if (!proposal) return null;

  const state      = Number(stateRaw ?? 0) as ProposalState;
  const isActive   = state === 0;
  const total      = (forVotes ?? 0n) + (againstVotes ?? 0n);
  const forPct     = total > 0n ? Number((forVotes ?? 0n) * 100n / total) : 0;
  const deadline   = new Date(Number(proposal.deadline) * 1000);

  return (
    <article className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <header className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-xs text-zinc-500">Proposal #{proposalId.toString()}</p>
          <h3 className="font-semibold leading-tight">{proposal.title}</h3>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATE_COLORS[state]}`}>
          {STATE_LABELS[state]}
        </span>
      </header>

      <p className="text-sm text-zinc-400 line-clamp-2">{proposal.description}</p>

      {/* Vote bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-zinc-500">
          <span>For {(forVotes ?? 0n).toString()}</span>
          <span>Against {(againstVotes ?? 0n).toString()}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${forPct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          Closes {deadline.toLocaleDateString()}
        </p>

        {isActive && voter && !hasVoted && onVote && (
          <div className="flex gap-2">
            <button
              onClick={() => onVote(proposalId, true)}
              className="rounded-lg bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400 hover:bg-green-500/30 transition-colors"
            >
              Vote For
            </button>
            <button
              onClick={() => onVote(proposalId, false)}
              className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-500/30 transition-colors"
            >
              Vote Against
            </button>
          </div>
        )}
        {hasVoted && (
          <span className="text-xs text-zinc-500 italic">You voted</span>
        )}
      </div>
    </article>
  );
}
