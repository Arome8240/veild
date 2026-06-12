// ABIs
export { VEILD_REGISTRY_ABI      } from "./abis/registry.js";
export { VEILD_MESSAGES_ABI      } from "./abis/messages.js";
export { VEILD_TIPS_ABI          } from "./abis/tips.js";
export { VEILD_SUBSCRIPTIONS_ABI } from "./abis/subscriptions.js";
export { VEILD_POOLS_ABI         } from "./abis/pools.js";
export { VEILD_BADGES_ABI        } from "./abis/badges.js";
export { VEILD_GOVERNANCE_ABI   } from "./abis/governance.js";
export { VEILD_AUCTION_ABI      } from "./abis/auction.js";
export { VEILD_REFERRAL_ABI     } from "./abis/referral.js";
export { VEILD_GIFTS_ABI        } from "./abis/gifts.js";
export { VEILD_STAKING_ABI      } from "./abis/staking.js";

// Addresses
export { CONTRACT_ADDRESSES, getAddresses } from "./addresses.js";
export type { ChainAddresses } from "./addresses.js";

// Contract configs (for wagmi / viem)
export {
  veildRegistry,
  veildMessages,
  veildTips,
  veildSubscriptions,
  veildPools,
  veildBadges,
  veildGovernance,
  veildAuction,
  veildReferral,
  veildGifts,
  veildStaking,
} from "./contracts.js";

// TypeScript types
export type {
  Creator,
  Message,
  WallPost,
  InboxStats,
  Tip,
  FanEntry,
  SubscriptionTier,
  Subscription,
  PoolStatus,
  Pool,
  Contribution,
  BadgeId,
  BadgeBitmap,
  RegisterCreatorParams,
  SendMessageParams,
  SendPriorityMessageParams,
  ReplyParams,
  TipParams,
  SubscribeParams,
  CreatePoolParams,
  ReferrerStats,
  GiftType,
  GiftRecord,
  StakeInfo,
  AuctionState,
  Auction,
  CreateAuctionParams,
  ProposalState,
  Proposal,
  CreateProposalParams,
  WriteResult,
} from "./types.js";
export { BADGE_IDS } from "./types.js";

// Client
export {
  VeildClient,
  createReadonlyClient,
  createTestnetClient,
} from "./VeildClient.js";
export type { VeildClientConfig } from "./VeildClient.js";
