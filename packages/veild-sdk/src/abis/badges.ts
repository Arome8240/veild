export const VEILD_BADGES_ABI = [
  // ── Read ──────────────────────────────────────────────────────────────────
  {
    name: "hasBadge",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "holder",  type: "address" },
      { name: "badgeId", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "getBadges",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "holder", type: "address" }],
    outputs: [{ type: "uint256[]" }],
  },
  {
    name: "badgeCount",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "holder", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getBadgeBitmap",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "holder", type: "address" }],
    outputs: [{ type: "bool[8]" }],
  },
  {
    name: "MAX_BADGE_ID",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "owner",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    name: "paused",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bool" }],
  },

  // ── Write (owner only) ────────────────────────────────────────────────────
  {
    name: "awardBadge",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "holder",  type: "address" },
      { name: "badgeId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "awardBadges",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "holder",   type: "address" },
      { name: "badgeIds", type: "uint256[]" },
    ],
    outputs: [],
  },
  {
    name: "revokeBadge",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "holder",  type: "address" },
      { name: "badgeId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "pause",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "unpause",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "transferOwnership",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "newOwner", type: "address" }],
    outputs: [],
  },
  {
    name: "renounceOwnership",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },

  // ── Events ────────────────────────────────────────────────────────────────
  {
    name: "BadgeAwarded",
    type: "event",
    inputs: [
      { name: "holder",  type: "address", indexed: true },
      { name: "badgeId", type: "uint256", indexed: true },
    ],
  },
  {
    name: "BadgeRevoked",
    type: "event",
    inputs: [
      { name: "holder",  type: "address", indexed: true },
      { name: "badgeId", type: "uint256", indexed: true },
    ],
  },
] as const;
