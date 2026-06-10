export const VEILD_REGISTRY_ABI = [
  // ── Write ──────────────────────────────────────────────────────────────────
  {
    type: "function",
    name: "register",
    inputs: [
      { name: "_username",  type: "string" },
      { name: "_name",      type: "string" },
      { name: "_bio",       type: "string" },
      { name: "_avatarCID", type: "string" },
      { name: "_category",  type: "string" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "updateProfile",
    inputs: [
      { name: "_name",      type: "string" },
      { name: "_bio",       type: "string" },
      { name: "_avatarCID", type: "string" },
      { name: "_category",  type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // ── Read ───────────────────────────────────────────────────────────────────
  {
    type: "function",
    name: "isRegistered",
    inputs: [{ name: "_addr", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCreator",
    inputs: [{ name: "_addr", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "username",      type: "string"  },
          { name: "name",          type: "string"  },
          { name: "bio",           type: "string"  },
          { name: "avatarCID",     type: "string"  },
          { name: "category",      type: "string"  },
          { name: "joinedAt",      type: "uint256" },
          { name: "totalMessages", type: "uint256" },
          { name: "isVerified",    type: "bool"    },
          { name: "isActive",      type: "bool"    },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCreatorByUsername",
    inputs: [{ name: "_username", type: "string" }],
    outputs: [
      { name: "addr", type: "address" },
      {
        name: "creator",
        type: "tuple",
        components: [
          { name: "username",      type: "string"  },
          { name: "name",          type: "string"  },
          { name: "bio",           type: "string"  },
          { name: "avatarCID",     type: "string"  },
          { name: "category",      type: "string"  },
          { name: "joinedAt",      type: "uint256" },
          { name: "totalMessages", type: "uint256" },
          { name: "isVerified",    type: "bool"    },
          { name: "isActive",      type: "bool"    },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalCreators",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registrationFee",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  // ── Events ─────────────────────────────────────────────────────────────────
  {
    type: "event",
    name: "CreatorRegistered",
    inputs: [
      { name: "creator",   type: "address", indexed: true  },
      { name: "username",  type: "string",  indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ProfileUpdated",
    inputs: [
      { name: "creator",   type: "address", indexed: true  },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "CreatorVerified",
    inputs: [
      { name: "creator",  type: "address", indexed: true  },
      { name: "verified", type: "bool",    indexed: false },
    ],
  },
] as const;
