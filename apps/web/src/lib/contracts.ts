/**
 * On-chain contract configuration for Veild.
 * ABIs are typed `as const` so wagmi/viem infer argument and return types automatically.
 */

// ─── Addresses ────────────────────────────────────────────────────────────────

export const REGISTRY_ADDRESS = (
  process.env.NEXT_PUBLIC_VEILD_REGISTRY_ADDRESS ??
  "0x4565001527ac0f6fa822020f8b4c3d33e0ca0aa4"
) as `0x${string}`;

export const MESSAGES_ADDRESS = (
  process.env.NEXT_PUBLIC_VEILD_MESSAGES_ADDRESS ??
  "0x687f4fcfeb8fcbdf1d16e187b1b3613f7f07398e"
) as `0x${string}`;

// ─── VeildRegistry ABI ────────────────────────────────────────────────────────

export const VEILD_REGISTRY_ABI = [
  {
    type: "function",
    name: "register",
    inputs: [
      { name: "_username", type: "string" },
      { name: "_name",     type: "string" },
      { name: "_bio",      type: "string" },
      { name: "_avatarCID",type: "string" },
      { name: "_category", type: "string" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "updateProfile",
    inputs: [
      { name: "_name",     type: "string" },
      { name: "_bio",      type: "string" },
      { name: "_avatarCID",type: "string" },
      { name: "_category", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
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
          { name: "username",      type: "string" },
          { name: "name",          type: "string" },
          { name: "bio",           type: "string" },
          { name: "avatarCID",     type: "string" },
          { name: "category",      type: "string" },
          { name: "joinedAt",      type: "uint256" },
          { name: "totalMessages", type: "uint256" },
          { name: "isVerified",    type: "bool" },
          { name: "isActive",      type: "bool" },
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
      { name: "addr",    type: "address" },
      {
        name: "creator",
        type: "tuple",
        components: [
          { name: "username",      type: "string" },
          { name: "name",          type: "string" },
          { name: "bio",           type: "string" },
          { name: "avatarCID",     type: "string" },
          { name: "category",      type: "string" },
          { name: "joinedAt",      type: "uint256" },
          { name: "totalMessages", type: "uint256" },
          { name: "isVerified",    type: "bool" },
          { name: "isActive",      type: "bool" },
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
] as const;

// ─── VeildMessages ABI ────────────────────────────────────────────────────────

export const VEILD_MESSAGES_ABI = [
  // Write
  {
    type: "function",
    name: "sendMessage",
    inputs: [
      { name: "_creator", type: "address" },
      { name: "_content", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "sendPriorityMessage",
    inputs: [
      { name: "_creator", type: "address" },
      { name: "_content", type: "string" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "replyToMessage",
    inputs: [
      { name: "_index",   type: "uint256" },
      { name: "_reply",   type: "string" },
      { name: "_publish", type: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "publishToWall",
    inputs: [{ name: "_index", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "archiveMessage",
    inputs: [{ name: "_index", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "likeWallPost",
    inputs: [
      { name: "_creator",   type: "address" },
      { name: "_wallIndex", type: "uint256" },
    ],
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
  // Read
  {
    type: "function",
    name: "getInbox",
    inputs: [{ name: "_creator", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "id",          type: "uint256" },
          { name: "content",     type: "string" },
          { name: "reply",       type: "string" },
          { name: "isPriority",  type: "bool" },
          { name: "fee",         type: "uint256" },
          { name: "sentAt",      type: "uint256" },
          { name: "repliedAt",   type: "uint256" },
          { name: "isAnswered",  type: "bool" },
          { name: "isPublished", type: "bool" },
          { name: "isArchived",  type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getWall",
    inputs: [{ name: "_creator", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "id",          type: "uint256" },
          { name: "messageId",   type: "uint256" },
          { name: "question",    type: "string" },
          { name: "answer",      type: "string" },
          { name: "likes",       type: "uint256" },
          { name: "publishedAt", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getInboxStats",
    inputs: [{ name: "_creator", type: "address" }],
    outputs: [
      {
        name: "stats",
        type: "tuple",
        components: [
          { name: "total",           type: "uint256" },
          { name: "unread",          type: "uint256" },
          { name: "priorityCount",   type: "uint256" },
          { name: "publishedCount",  type: "uint256" },
          { name: "pendingEarnings", type: "uint256" },
        ],
      },
    ],
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
    name: "hasLiked",
    inputs: [
      { name: "_creator",   type: "address" },
      { name: "_wallIndex", type: "uint256" },
      { name: "_user",      type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "priorityFee",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;
