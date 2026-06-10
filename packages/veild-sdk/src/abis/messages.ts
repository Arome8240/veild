export const VEILD_MESSAGES_ABI = [
  // ── Write ──────────────────────────────────────────────────────────────────
  {
    type: "function",
    name: "sendMessage",
    inputs: [
      { name: "_creator", type: "address" },
      { name: "_content", type: "string"  },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "sendPriorityMessage",
    inputs: [
      { name: "_creator", type: "address" },
      { name: "_content", type: "string"  },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "replyToMessage",
    inputs: [
      { name: "_index",   type: "uint256" },
      { name: "_reply",   type: "string"  },
      { name: "_publish", type: "bool"    },
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
  // ── Read ───────────────────────────────────────────────────────────────────
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
          { name: "content",     type: "string"  },
          { name: "reply",       type: "string"  },
          { name: "isPriority",  type: "bool"    },
          { name: "fee",         type: "uint256" },
          { name: "sentAt",      type: "uint256" },
          { name: "repliedAt",   type: "uint256" },
          { name: "isAnswered",  type: "bool"    },
          { name: "isPublished", type: "bool"    },
          { name: "isArchived",  type: "bool"    },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMessage",
    inputs: [
      { name: "_creator", type: "address" },
      { name: "_index",   type: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id",          type: "uint256" },
          { name: "content",     type: "string"  },
          { name: "reply",       type: "string"  },
          { name: "isPriority",  type: "bool"    },
          { name: "fee",         type: "uint256" },
          { name: "sentAt",      type: "uint256" },
          { name: "repliedAt",   type: "uint256" },
          { name: "isAnswered",  type: "bool"    },
          { name: "isPublished", type: "bool"    },
          { name: "isArchived",  type: "bool"    },
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
          { name: "question",    type: "string"  },
          { name: "answer",      type: "string"  },
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
    name: "getLengths",
    inputs: [{ name: "_creator", type: "address" }],
    outputs: [
      { name: "inboxLen", type: "uint256" },
      { name: "wallLen",  type: "uint256" },
    ],
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
  {
    type: "function",
    name: "platformFeeBps",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  // ── Events ─────────────────────────────────────────────────────────────────
  {
    type: "event",
    name: "MessageSent",
    inputs: [
      { name: "creator",    type: "address", indexed: true  },
      { name: "messageId",  type: "uint256", indexed: true  },
      { name: "isPriority", type: "bool",    indexed: false },
      { name: "fee",        type: "uint256", indexed: false },
      { name: "timestamp",  type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "MessageReplied",
    inputs: [
      { name: "creator",   type: "address", indexed: true  },
      { name: "messageId", type: "uint256", indexed: true  },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "MessagePublished",
    inputs: [
      { name: "creator",    type: "address", indexed: true  },
      { name: "messageId",  type: "uint256", indexed: true  },
      { name: "wallPostId", type: "uint256", indexed: true  },
      { name: "timestamp",  type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "WallPostLiked",
    inputs: [
      { name: "creator",      type: "address", indexed: true  },
      { name: "wallPostId",   type: "uint256", indexed: true  },
      { name: "liker",        type: "address", indexed: true  },
      { name: "newLikeCount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "EarningsClaimed",
    inputs: [
      { name: "creator",   type: "address", indexed: true  },
      { name: "amount",    type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;
