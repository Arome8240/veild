"use client";

import { useWriteContract } from "wagmi";

// cUSD on Celo mainnet — MiniPay defaults to paying gas in cUSD, not native CELO.
// Without feeCurrency, MiniPay wallets (which typically hold no CELO) will revert.
const CUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`;

function isMiniPayBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as Window & { ethereum?: { isMiniPay?: boolean } }).ethereum?.isMiniPay;
}

type WriteParams = Parameters<ReturnType<typeof useWriteContract>["writeContract"]>[0];

/**
 * Drop-in replacement for wagmi's useWriteContract.
 * Automatically appends feeCurrency (cUSD) to every write when running inside
 * MiniPay, so gas is paid in cUSD instead of native CELO.
 *
 * feeCurrency is a Celo chain extension not present in wagmi's generic types,
 * so params is typed as `any` to avoid false-positive TypeScript errors in callers.
 */
export function useCeloWrite() {
  const { writeContract: _write, ...rest } = useWriteContract();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function writeContract(params: any) {
    _write(
      isMiniPayBrowser()
        ? ({ ...params, feeCurrency: CUSD_ADDRESS } as unknown as WriteParams)
        : (params as WriteParams),
    );
  }

  return { writeContract, ...rest };
}
