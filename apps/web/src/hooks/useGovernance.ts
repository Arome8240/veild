"use client";

import { useCallback } from "react";
import { useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { useCeloWrite } from "./useCeloWrite";
import { type Address } from "viem";
import { veildGovernance, type Proposal, type ProposalState } from "@/lib/contracts";

export function useVeildGovernance() {
  const { writeContract, data: txHash, isPending, error, reset } = useCeloWrite();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const createProposal = useCallback((title: string, description: string) => {
    writeContract({
      ...veildGovernance.celo,
      functionName: "createProposal",
      args: [title, description],
    });
  }, [writeContract]);

  const castVote = useCallback((proposalId: bigint, support: boolean) => {
    writeContract({
      ...veildGovernance.celo,
      functionName: "castVote",
      args: [proposalId, support],
    });
  }, [writeContract]);

  const finalizeProposal = useCallback((proposalId: bigint) => {
    writeContract({
      ...veildGovernance.celo,
      functionName: "finalizeProposal",
      args: [proposalId],
    });
  }, [writeContract]);

  const cancelProposal = useCallback((proposalId: bigint) => {
    writeContract({
      ...veildGovernance.celo,
      functionName: "cancelProposal",
      args: [proposalId],
    });
  }, [writeContract]);

  return {
    txHash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    reset,
    createProposal,
    castVote,
    finalizeProposal,
    cancelProposal,
  };
}

export function useProposal(proposalId: bigint | undefined) {
  const result = useReadContract({
    ...veildGovernance.celo,
    functionName: "getProposal",
    args: proposalId !== undefined ? [proposalId] : undefined,
    query: { enabled: proposalId !== undefined },
  });
  return { ...result, data: result.data as Proposal | undefined };
}

export function useProposalState(proposalId: bigint | undefined) {
  const result = useReadContract({
    ...veildGovernance.celo,
    functionName: "getProposalState",
    args: proposalId !== undefined ? [proposalId] : undefined,
    query: { enabled: proposalId !== undefined },
  });
  return { ...result, data: result.data as ProposalState | undefined };
}

export function useProposalCount() {
  const result = useReadContract({
    ...veildGovernance.celo,
    functionName: "proposalCount",
    args: [],
  });
  return { ...result, data: (result.data as bigint | undefined) ?? 0n };
}

export function useHasVoted(proposalId: bigint | undefined, voter: Address | undefined) {
  const result = useReadContract({
    ...veildGovernance.celo,
    functionName: "hasVoted",
    args: proposalId !== undefined && voter ? [proposalId, voter] : undefined,
    query: { enabled: proposalId !== undefined && !!voter },
  });
  return { ...result, data: (result.data as boolean | undefined) ?? false };
}

export function useVoteTotals(proposalId: bigint | undefined) {
  const result = useReadContract({
    ...veildGovernance.celo,
    functionName: "getVoteTotals",
    args: proposalId !== undefined ? [proposalId] : undefined,
    query: { enabled: proposalId !== undefined },
  });
  const raw = result.data as readonly [bigint, bigint] | undefined;
  return {
    ...result,
    forVotes:     raw?.[0] ?? 0n,
    againstVotes: raw?.[1] ?? 0n,
  };
}
