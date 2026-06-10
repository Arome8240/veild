import type { Address, Hash } from "viem";

// ─── On-chain struct types ─────────────────────────────────────────────────────

export interface Creator {
  username:      string;
  name:          string;
  bio:           string;
  avatarCID:     string;
  category:      string;
  joinedAt:      bigint;
  totalMessages: bigint;
  isVerified:    boolean;
  isActive:      boolean;
}

export interface Message {
  id:          bigint;
  content:     string;
  reply:       string;
  isPriority:  boolean;
  fee:         bigint;
  sentAt:      bigint;
  repliedAt:   bigint;
  isAnswered:  boolean;
  isPublished: boolean;
  isArchived:  boolean;
}

export interface WallPost {
  id:          bigint;
  messageId:   bigint;
  question:    string;
  answer:      string;
  likes:       bigint;
  publishedAt: bigint;
}

export interface InboxStats {
  total:           bigint;
  unread:          bigint;
  priorityCount:   bigint;
  publishedCount:  bigint;
  pendingEarnings: bigint;
}

// ─── SDK param types ───────────────────────────────────────────────────────────

export interface RegisterCreatorParams {
  username:  string;
  name:      string;
  bio:       string;
  avatarCID: string;
  category:  string;
  /** Registration fee in wei. Defaults to 0 if not set by the contract. */
  value?:    bigint;
}

export interface SendMessageParams {
  creatorAddress: Address;
  content:        string;
}

export interface SendPriorityMessageParams {
  creatorAddress: Address;
  content:        string;
  /** Amount to send in wei. Defaults to contract's priorityFee if omitted. */
  fee?:           bigint;
}

export interface ReplyParams {
  messageIndex: bigint;
  reply:        string;
  publishToWall: boolean;
}

// ─── VeildTips types ──────────────────────────────────────────────────────────

export interface Tip {
  fan:     Address;
  amount:  bigint;
  message: string;
  sentAt:  bigint;
}

export interface FanEntry {
  fan:         Address;
  totalTipped: bigint;
}

// ─── VeildSubscriptions types ─────────────────────────────────────────────────

export interface SubscriptionTier {
  pricePerMonth: bigint;
  label:         string;
  isActive:      boolean;
}

export interface Subscription {
  tierId:    bigint;
  startedAt: bigint;
  expiresAt: bigint;
  renewals:  bigint;
}

// ─── VeildPools types ─────────────────────────────────────────────────────────

/** Mirrors the PoolStatus enum in VeildPools.sol */
export type PoolStatus = 0 | 1 | 2 | 3; // Active | Answered | Expired | Cancelled

export interface Pool {
  id:          bigint;
  creator:     Address;
  question:    string;
  totalFunded: bigint;
  deadline:    bigint;
  status:      PoolStatus;
  answer:      string;
  answeredAt:  bigint;
}

export interface Contribution {
  contributor: Address;
  amount:      bigint;
  refunded:    boolean;
}

// ─── SDK param types (new) ────────────────────────────────────────────────────

export interface TipParams {
  creatorAddress: Address;
  message?:       string;
  amount:         bigint;
}

export interface SubscribeParams {
  creatorAddress: Address;
  tierId:         bigint;
  amount:         bigint;
}

export interface CreatePoolParams {
  creatorAddress: Address;
  question:       string;
  duration:       bigint; // seconds
  amount:         bigint;
}

// ─── VeildBadges types ────────────────────────────────────────────────────────

/**
 * Badge ID constants. Each value corresponds to a specific on-chain achievement.
 *
 * 0 — FirstMessage   : creator received their first message
 * 1 — RisingStar     : creator crossed 100 messages
 * 2 — VerifiedCreator: manually verified by the platform
 * 3 — FirstTip       : creator received their first tip
 * 4 — TopTipper      : fan tipped more than 1 CELO total
 * 5 — Subscriber     : fan holds an active subscription
 * 6 — PoolCreator    : creator opened their first question pool
 * 7 — PoolAnswerer   : creator answered a funded pool question
 */
export const BADGE_IDS = {
  FirstMessage:    0n,
  RisingStar:      1n,
  VerifiedCreator: 2n,
  FirstTip:        3n,
  TopTipper:       4n,
  Subscriber:      5n,
  PoolCreator:     6n,
  PoolAnswerer:    7n,
} as const;

export type BadgeId = (typeof BADGE_IDS)[keyof typeof BADGE_IDS];

export interface BadgeBitmap {
  firstMessage:    boolean;
  risingStar:      boolean;
  verifiedCreator: boolean;
  firstTip:        boolean;
  topTipper:       boolean;
  subscriber:      boolean;
  poolCreator:     boolean;
  poolAnswerer:    boolean;
}

// ─── Result types ──────────────────────────────────────────────────────────────

export interface WriteResult {
  hash:    Hash;
  /** Wait for the tx to be mined and return the receipt. */
  wait:    () => Promise<import("viem").TransactionReceipt>;
}
