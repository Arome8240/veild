import type { Address } from "viem";

export interface ChainAddresses {
  registry:      Address;
  messages:      Address;
  tips:          Address;
  subscriptions: Address;
  pools:         Address;
  badges:        Address;
  governance:    Address;
  auction:       Address;
  referral:      Address;
  gifts:         Address;
  staking:       Address;
}

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

/** Deployed contract addresses keyed by chain ID. */
export const CONTRACT_ADDRESSES: Record<number, ChainAddresses> = {
  // Celo Mainnet
  42220: {
    registry:      "0x4565001527ac0f6fa822020f8b4c3d33e0ca0aa4",
    messages:      "0x687f4fcfeb8fcbdf1d16e187b1b3613f7f07398e",
    tips:          "0x031c1537779e3b5ee55533c17a48f7d008f85160",
    subscriptions: "0x2ccbb81331eaf1718b584eecfc76741a70c8f350",
    pools:         "0xdaa63693b90da8dea6494ff0698b55c38e5a772d",
    badges:        "0x14d5f9c860d4dc1908f49bfbd04e3e226eb56ae8",
    governance:    "0x8fc0b06649d92ccd2ecfa858d41b88b680e9910b",
    auction:       "0x7b14d324548f7b2b1d9aac6a18cd814187043e51",
    referral:      "0x20a3ec86abd297e9adfb88b9147ed227ed6ed95b",
    gifts:         "0x2c5eb1daf529054c11c7adada2b9ec988a1adfee",
    staking:       "0xa51eeacff6702d3eee5018fe025b173c24e8d857",
  },
  // Celo Alfajores Testnet — fill in after testnet deploy
  44787: {
    registry:      ZERO,
    messages:      ZERO,
    tips:          ZERO,
    subscriptions: ZERO,
    pools:         ZERO,
    badges:        ZERO,
    governance:    ZERO,
    auction:       ZERO,
    referral:      ZERO,
    gifts:         ZERO,
    staking:       ZERO,
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
