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
 */
export function useCeloWrite() {
  const { writeContract: _write, ...rest } = useWriteContract();

  function writeContract(params: WriteParams) {
    _write(
      isMiniPayBrowser()
        ? ({ ...params, feeCurrency: CUSD_ADDRESS } as WriteParams)
        : params,
    );
  }

  return { writeContract, ...rest };
}
