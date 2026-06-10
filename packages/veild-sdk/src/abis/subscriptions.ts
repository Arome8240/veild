export const VEILD_SUBSCRIPTIONS_ABI = [
  // ── Write: Creator actions ─────────────────────────────────────────────────
  {
    type: "function",
    name: "createTier",
    inputs: [
      { name: "_pricePerMonth", type: "uint256" },
      { name: "_label",         type: "string"  },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateTierPrice",
    inputs: [
      { name: "_tierId",   type: "uint256" },
      { name: "_newPrice", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deactivateTier",
    inputs: [{ name: "_tierId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimEarnings",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // ── Write: Fan actions ─────────────────────────────────────────────────────
  {
    type: "function",
    name: "subscribe",
    inputs: [
      { name: "_creator", type: "address" },
      { name: "_tierId",  type: "uint256" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  // ── Write: Admin ───────────────────────────────────────────────────────────
  {
    type: "function",
    name: "setPlatformFee",
    inputs: [{ name: "_bps", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawPlatformFees",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "pause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "unpause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // ── Read ───────────────────────────────────────────────────────────────────
  {
    type: "function",
    name: "isSubscribed",
    inputs: [
      { name: "_creator", type: "address" },
      { name: "_fan",     type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSubscription",
    inputs: [
      { name: "_creator", type: "address" },
      { name: "_fan",     type: "address" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "tierId",    type: "uint256" },
          { name: "startedAt", type: "uint256" },
          { name: "expiresAt", type: "uint256" },
          { name: "renewals",  type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTiers",
    inputs: [{ name: "_creator", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "pricePerMonth", type: "uint256" },
          { name: "label",         type: "string"  },
          { name: "isActive",      type: "bool"    },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTierCount",
    inputs: [{ name: "_creator", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEarnings",
    inputs: [{ name: "_creator", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "subscriberCount",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "platformFeeBps",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "platformFeesAccrued",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registry",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "SUBSCRIPTION_PERIOD",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  // ── Events ─────────────────────────────────────────────────────────────────
  {
    type: "event",
    name: "TierCreated",
    inputs: [
      { name: "creator",       type: "address", indexed: true  },
      { name: "tierId",        type: "uint256", indexed: false },
      { name: "pricePerMonth", type: "uint256", indexed: false },
      { name: "label",         type: "string",  indexed: false },
    ],
  },
  {
    type: "event",
    name: "TierUpdated",
    inputs: [
      { name: "creator",  type: "address", indexed: true  },
      { name: "tierId",   type: "uint256", indexed: false },
      { name: "newPrice", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "TierDeactivated",
    inputs: [
      { name: "creator", type: "address", indexed: true  },
      { name: "tierId",  type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Subscribed",
    inputs: [
      { name: "creator",   type: "address", indexed: true  },
      { name: "fan",       type: "address", indexed: true  },
      { name: "tierId",    type: "uint256", indexed: false },
      { name: "expiresAt", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Renewed",
    inputs: [
      { name: "creator",      type: "address", indexed: true  },
      { name: "fan",          type: "address", indexed: true  },
      { name: "newExpiresAt", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "EarningsClaimed",
    inputs: [
      { name: "creator", type: "address", indexed: true  },
      { name: "amount",  type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PlatformFeeUpdated",
    inputs: [
      { name: "oldBps", type: "uint256", indexed: false },
      { name: "newBps", type: "uint256", indexed: false },
    ],
  },
] as const;
