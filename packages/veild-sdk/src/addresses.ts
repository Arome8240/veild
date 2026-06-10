import type { Address } from "viem";

export interface ChainAddresses {
  registry:      Address;
  messages:      Address;
  tips:          Address;
  subscriptions: Address;
  pools:         Address;
  badges:        Address;
}

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

/** Deployed contract addresses keyed by chain ID. */
export const CONTRACT_ADDRESSES: Record<number, ChainAddresses> = {
  // Celo Mainnet
  42220: {
    registry:      "0x4565001527ac0f6fa822020f8b4c3d33e0ca0aa4",
    messages:      "0x687f4fcfeb8fcbdf1d16e187b1b3613f7f07398e",
    // Fill these in after deploying the v0.3.0 contracts
    tips:          ZERO,
    subscriptions: ZERO,
    pools:         ZERO,
    badges:        ZERO,
  },
  // Celo Alfajores Testnet — fill in after testnet deploy
  44787: {
    registry:      ZERO,
    messages:      ZERO,
    tips:          ZERO,
    subscriptions: ZERO,
    pools:         ZERO,
    badges:        ZERO,
  },
} as const;

export function getAddresses(chainId: number): ChainAddresses {
  const addrs = CONTRACT_ADDRESSES[chainId];
  if (!addrs) {
    throw new Error(
      `Veild contracts not deployed on chain ${chainId}. Supported chains: ${Object.keys(CONTRACT_ADDRESSES).join(", ")}`
    );
  }
  return addrs;
}
