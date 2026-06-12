export const VEILD_FEE_DISTRIBUTOR_ABI = [
  {
    type: "function",
    name: "distribute",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setRecipient",
    inputs: [
      { name: "index", type: "uint256" },
      { name: "addr",  type: "address" },
      { name: "bps",   type: "uint256" },
      { name: "label", type: "string"  },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "recipientCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "recipients",
    inputs: [{ name: "index", type: "uint256" }],
    outputs: [
      { name: "addr",  type: "address" },
      { name: "bps",   type: "uint256" },
      { name: "label", type: "string"  },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "Distributed",
    inputs: [
      { name: "total",     type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "RecipientUpdated",
    inputs: [
      { name: "index", type: "uint256", indexed: true  },
      { name: "addr",  type: "address", indexed: false },
      { name: "bps",   type: "uint256", indexed: false },
    ],
  },
] as const;
