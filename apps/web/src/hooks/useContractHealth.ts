"use client";

import { useReadContract } from "wagmi";
import {
  veildRegistry,
  veildMessages,
  veildTips,
  veildSubscriptions,
} from "@/lib/contracts";

interface ContractStatus {
  registry:      boolean | undefined;
  messages:      boolean | undefined;
  tips:          boolean | undefined;
  subscriptions: boolean | undefined;
}

/**
 * Quick health check — reads a lightweight view from each core contract
 * to detect if any are paused or unreachable.
 */
export function useContractHealth(): { status: ContractStatus; anyLoading: boolean } {
  const reg = useReadContract({ ...veildRegistry.celo,      functionName: "totalCreators",    args: [] });
  const msg = useReadContract({ ...veildMessages.celo,      functionName: "platformFeeBps",   args: [] });
  const tip = useReadContract({ ...veildTips.celo,          functionName: "platformFeeBps",   args: [] });
  const sub = useReadContract({ ...veildSubscriptions.celo, functionName: "platformFeeBps",   args: [] });

  return {
    status: {
      registry:      reg.isSuccess  ? true : reg.isError  ? false : undefined,
      messages:      msg.isSuccess  ? true : msg.isError  ? false : undefined,
      tips:          tip.isSuccess  ? true : tip.isError  ? false : undefined,
      subscriptions: sub.isSuccess  ? true : sub.isError  ? false : undefined,
    },
    anyLoading: reg.isLoading || msg.isLoading || tip.isLoading || sub.isLoading,
  };
}
