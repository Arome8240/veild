import type { Address } from "viem";
import type { Message, WallPost, Creator, InboxStats } from "veild-sdk";

// Re-export sdk types so the rest of the app imports from one place
export type { Message, WallPost, Creator, InboxStats };

// ─── UI State types ───────────────────────────────────────────────────────────

export type InboxTab = "all" | "priority" | "unanswered";

export interface Particle {
  id: number;
  x: number;
  color: string;
}

export interface RegisterFormState {
  username: string;
  name: string;
  bio: string;
  category: string;
  avatarCID: string;
}

// ─── Component prop types ─────────────────────────────────────────────────────

export interface CreatorCardProps {
  address: Address;
  profile: Creator;
  avatarUrl: string;
}

export interface StatItem {
  label: string;
  value: string;
  sub?: string;
  colorClass?: string;
  bgClass?: string;
}

// ─── Enriched Message (with index for on-chain operations) ───────────────────
export interface IndexedMessage extends Message {
  /** Position in the creator's inbox array — used for on-chain calls */
  index: number;
}

// ─── Sort options ─────────────────────────────────────────────────────────────
export type WallSortKey = "top" | "new";
