export const VEILD_POOLS_ABI = [
  // ── Write: Pool creation & funding ────────────────────────────────────────
  {
    type: "function",
    name: "createPool",
    inputs: [
      { name: "_creator",  type: "address" },
      { name: "_question", type: "string"  },
      { name: "_duration", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "contribute",
    inputs: [{ name: "_poolId", type: "uint256" }],
    outputs: [],
    stateMutability: "payable",
  },
  // ── Write: Creator actions ─────────────────────────────────────────────────
  {
    type: "function",
    name: "answerPool",
    inputs: [
      { name: "_poolId", type: "uint256" },
      { name: "_answer", type: "string"  },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // ── Write: Anyone (after deadline) ────────────────────────────────────────
  {
    type: "function",
    name: "markExpired",
    inputs: [{ name: "_poolId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimRefund",
    inputs: [
      { name: "_poolId",       type: "uint256" },
      { name: "_contribIndex", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // ── Write: Admin ───────────────────────────────────────────────────────────
  {
    type: "function",
    name: "cancelPool",
    inputs: [{ name: "_poolId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
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
    name: "getPool",
    inputs: [{ name: "_poolId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id",          type: "uint256"  },
          { name: "creator",     type: "address"  },
          { name: "question",    type: "string"   },
          { name: "totalFunded", type: "uint256"  },
          { name: "deadline",    type: "uint256"  },
          { name: "status",      type: "uint8"    },  // PoolStatus enum
          { name: "answer",      type: "string"   },
          { name: "answeredAt",  type: "uint256"  },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPoolCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getContributions",
    inputs: [{ name: "_poolId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "contributor", type: "address" },
          { name: "amount",      type: "uint256" },
          { name: "refunded",    type: "bool"    },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getActivePools",
    inputs: [{ name: "_creator", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "id",          type: "uint256"  },
          { name: "creator",     type: "address"  },
          { name: "question",    type: "string"   },
          { name: "totalFunded", type: "uint256"  },
          { name: "deadline",    type: "uint256"  },
          { name: "status",      type: "uint8"    },
          { name: "answer",      type: "string"   },
          { name: "answeredAt",  type: "uint256"  },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPoolsByCreator",
    inputs: [
      { name: "_creator", type: "address" },
      { name: "_offset",  type: "uint256" },
      { name: "_limit",   type: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "id",          type: "uint256"  },
          { name: "creator",     type: "address"  },
          { name: "question",    type: "string"   },
          { name: "totalFunded", type: "uint256"  },
          { name: "deadline",    type: "uint256"  },
          { name: "status",      type: "uint8"    },
          { name: "answer",      type: "string"   },
          { name: "answeredAt",  type: "uint256"  },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "contributed",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "address" },
    ],
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
  // ── Events ─────────────────────────────────────────────────────────────────
  {
    type: "event",
    name: "PoolCreated",
    inputs: [
      { name: "poolId",        type: "uint256", indexed: true  },
      { name: "creator",       type: "address", indexed: true  },
      { name: "starter",       type: "address", indexed: true  },
      { name: "question",      type: "string",  indexed: false },
      { name: "initialAmount", type: "uint256", indexed: false },
      { name: "deadline",      type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PoolContribution",
    inputs: [
      { name: "poolId",      type: "uint256", indexed: true  },
      { name: "contributor", type: "address", indexed: true  },
      { name: "amount",      type: "uint256", indexed: false },
      { name: "newTotal",    type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PoolAnswered",
    inputs: [
      { name: "poolId",    type: "uint256", indexed: true  },
      { name: "creator",   type: "address", indexed: true  },
      { name: "payout",    type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PoolExpired",
    inputs: [
      { name: "poolId",    type: "uint256", indexed: true  },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PoolCancelled",
    inputs: [{ name: "poolId", type: "uint256", indexed: true }],
  },
  {
    type: "event",
    name: "RefundClaimed",
    inputs: [
      { name: "poolId",      type: "uint256", indexed: true  },
      { name: "contributor", type: "address", indexed: true  },
      { name: "amount",      type: "uint256", indexed: false },
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
