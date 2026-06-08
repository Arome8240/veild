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
  CONTRACT_ADDRESSES,
  getAddresses,
  veildRegistry,
  veildMessages,
  veildTips,
  veildSubscriptions,
  veildPools,
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
  "0x0000000000000000000000000000000000000000"
) as `0x${string}`;

export const SUBSCRIPTIONS_ADDRESS = (
  process.env.NEXT_PUBLIC_VEILD_SUBSCRIPTIONS_ADDRESS ??
  "0x0000000000000000000000000000000000000000"
) as `0x${string}`;

export const POOLS_ADDRESS = (
  process.env.NEXT_PUBLIC_VEILD_POOLS_ADDRESS ??
  "0x0000000000000000000000000000000000000000"
) as `0x${string}`;
