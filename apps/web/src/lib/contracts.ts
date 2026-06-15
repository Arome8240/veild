/**
 * Re-exports from veild-sdk so the rest of the app imports from one place.
 * When veild-sdk is published to npm this file needs no changes —
 * just swap the local link for the versioned package.
 */
export {
  VEILD_REGISTRY_ABI,
  VEILD_MESSAGES_ABI,
  VEILD_TIPS_ABI,
  VEILD_SUBSCRIPTIONS_ABI,
  VEILD_POOLS_ABI,
  VEILD_BADGES_ABI,
  CONTRACT_ADDRESSES,
  getAddresses,
  veildRegistry,
  veildMessages,
  veildTips,
  veildSubscriptions,
  veildPools,
  veildBadges,
  BADGE_IDS,
  VEILD_GOVERNANCE_ABI,
  VEILD_AUCTION_ABI,
  VEILD_REFERRAL_ABI,
  VEILD_GIFTS_ABI,
  VEILD_STAKING_ABI,
  veildGovernance,
  veildAuction,
  veildReferral,
  veildGifts,
  veildStaking,
  VeildClient,
  createReadonlyClient,
  createTestnetClient,
} from "veild-sdk";

export type {
  Creator,
  Message,
  WallPost,
  InboxStats,
  Tip,
  FanEntry,
  SubscriptionTier,
  Subscription,
  Pool,
  Contribution,
  PoolStatus,
  BadgeId,
  BadgeBitmap,
  Proposal,
  ProposalState,
  CreateProposalParams,
  Auction,
  AuctionState,
  CreateAuctionParams,
  ReferrerStats,
  GiftType,
  GiftRecord,
  StakeInfo,
  RegisterCreatorParams,
  SendMessageParams,
  SendPriorityMessageParams,
  ReplyParams,
  TipParams,
  SubscribeParams,
  CreatePoolParams,
  WriteResult,
  VeildClientConfig,
  ChainAddresses,
} from "veild-sdk";

// ─── Addresses for the current env ───────────────────────────────────────────
// NEXT_PUBLIC_ vars take priority so you can override per-deployment.

export const REGISTRY_ADDRESS = (
  process.env.NEXT_PUBLIC_VEILD_REGISTRY_ADDRESS ??
  "0x4565001527ac0f6fa822020f8b4c3d33e0ca0aa4"
) as `0x${string}`;

export const MESSAGES_ADDRESS = (
  process.env.NEXT_PUBLIC_VEILD_MESSAGES_ADDRESS ??
  "0x687f4fcfeb8fcbdf1d16e187b1b3613f7f07398e"
) as `0x${string}`;

export const TIPS_ADDRESS = (
  process.env.NEXT_PUBLIC_VEILD_TIPS_ADDRESS ??
  "0x031c1537779e3b5ee55533c17a48f7d008f85160"
) as `0x${string}`;

export const SUBSCRIPTIONS_ADDRESS = (
  process.env.NEXT_PUBLIC_VEILD_SUBSCRIPTIONS_ADDRESS ??
  "0x2ccbb81331eaf1718b584eecfc76741a70c8f350"
) as `0x${string}`;

export const POOLS_ADDRESS = (
  process.env.NEXT_PUBLIC_VEILD_POOLS_ADDRESS ??
  "0xdaa63693b90da8dea6494ff0698b55c38e5a772d"
) as `0x${string}`;

export const BADGES_ADDRESS = (
  process.env.NEXT_PUBLIC_VEILD_BADGES_ADDRESS ??
  "0x14d5f9c860d4dc1908f49bfbd04e3e226eb56ae8"
) as `0x${string}`;

export const GOVERNANCE_ADDRESS = (
  process.env.NEXT_PUBLIC_VEILD_GOVERNANCE_ADDRESS ??
  "0x8fc0b06649d92ccd2ecfa858d41b88b680e9910b"
) as `0x${string}`;

export const AUCTION_ADDRESS = (
  process.env.NEXT_PUBLIC_VEILD_AUCTION_ADDRESS ??
  "0x7b14d324548f7b2b1d9aac6a18cd814187043e51"
) as `0x${string}`;

export const REFERRAL_ADDRESS = (
  process.env.NEXT_PUBLIC_VEILD_REFERRAL_ADDRESS ??
  "0x20a3ec86abd297e9adfb88b9147ed227ed6ed95b"
) as `0x${string}`;

export const GIFTS_ADDRESS = (
  process.env.NEXT_PUBLIC_VEILD_GIFTS_ADDRESS ??
  "0x2c5eb1daf529054c11c7adada2b9ec988a1adfee"
) as `0x${string}`;

export const STAKING_ADDRESS = (
  process.env.NEXT_PUBLIC_VEILD_STAKING_ADDRESS ??
  "0xa51eeacff6702d3eee5018fe025b173c24e8d857"
) as `0x${string}`;

export const FEE_DISTRIBUTOR_ADDRESS = (
  process.env.NEXT_PUBLIC_VEILD_FEE_DISTRIBUTOR_ADDRESS ??
  "0xe067d28285bd7f5f297b1a5a7be8a8c7f0823c17"
) as `0x${string}`;
