/**
 * Pre-built contract config objects for use directly with wagmi hooks
 * (useReadContract, useWriteContract, useWatchContractEvent, etc.)
 *
 * Example — wagmi:
 *   import { veildMessages } from 'veild-sdk';
 *   const { data } = useReadContract({ ...veildMessages.celo, functionName: 'getWall', args: [addr] });
 *
 * Example — viem:
 *   import { veildRegistry } from 'veild-sdk';
 *   await publicClient.readContract({ ...veildRegistry.celo, functionName: 'getCreator', args: [addr] });
 */

import { VEILD_REGISTRY_ABI      } from "./abis/registry.js";
import { VEILD_MESSAGES_ABI      } from "./abis/messages.js";
import { VEILD_TIPS_ABI          } from "./abis/tips.js";
import { VEILD_SUBSCRIPTIONS_ABI } from "./abis/subscriptions.js";
import { VEILD_POOLS_ABI         } from "./abis/pools.js";
import { VEILD_BADGES_ABI        } from "./abis/badges.js";
import { VEILD_GOVERNANCE_ABI    } from "./abis/governance.js";
import { VEILD_AUCTION_ABI       } from "./abis/auction.js";
import { VEILD_REFERRAL_ABI      } from "./abis/referral.js";
import { VEILD_GIFTS_ABI         } from "./abis/gifts.js";
import { VEILD_STAKING_ABI       } from "./abis/staking.js";
import { CONTRACT_ADDRESSES      } from "./addresses.js";

export const veildRegistry = {
  celo: {
    address: CONTRACT_ADDRESSES[42220].registry,
    abi:     VEILD_REGISTRY_ABI,
  },
  alfajores: {
    address: CONTRACT_ADDRESSES[44787].registry,
    abi:     VEILD_REGISTRY_ABI,
  },
} as const;

export const veildMessages = {
  celo: {
    address: CONTRACT_ADDRESSES[42220].messages,
    abi:     VEILD_MESSAGES_ABI,
  },
  alfajores: {
    address: CONTRACT_ADDRESSES[44787].messages,
    abi:     VEILD_MESSAGES_ABI,
  },
} as const;

export const veildTips = {
  celo: {
    address: CONTRACT_ADDRESSES[42220].tips,
    abi:     VEILD_TIPS_ABI,
  },
  alfajores: {
    address: CONTRACT_ADDRESSES[44787].tips,
    abi:     VEILD_TIPS_ABI,
  },
} as const;

export const veildSubscriptions = {
  celo: {
    address: CONTRACT_ADDRESSES[42220].subscriptions,
    abi:     VEILD_SUBSCRIPTIONS_ABI,
  },
  alfajores: {
    address: CONTRACT_ADDRESSES[44787].subscriptions,
    abi:     VEILD_SUBSCRIPTIONS_ABI,
  },
} as const;

export const veildPools = {
  celo: {
    address: CONTRACT_ADDRESSES[42220].pools,
    abi:     VEILD_POOLS_ABI,
  },
  alfajores: {
    address: CONTRACT_ADDRESSES[44787].pools,
    abi:     VEILD_POOLS_ABI,
  },
} as const;

export const veildBadges = {
  celo: {
    address: CONTRACT_ADDRESSES[42220].badges,
    abi:     VEILD_BADGES_ABI,
  },
  alfajores: {
    address: CONTRACT_ADDRESSES[44787].badges,
    abi:     VEILD_BADGES_ABI,
  },
} as const;

export const veildAuction = {
  celo: {
    address: CONTRACT_ADDRESSES[42220].auction,
    abi:     VEILD_AUCTION_ABI,
  },
  alfajores: {
    address: CONTRACT_ADDRESSES[44787].auction,
    abi:     VEILD_AUCTION_ABI,
  },
} as const;

export const veildReferral = {
  celo: {
    address: CONTRACT_ADDRESSES[42220].referral,
    abi:     VEILD_REFERRAL_ABI,
  },
  alfajores: {
    address: CONTRACT_ADDRESSES[44787].referral,
    abi:     VEILD_REFERRAL_ABI,
  },
} as const;

export const veildGifts = {
  celo: {
    address: CONTRACT_ADDRESSES[42220].gifts,
    abi:     VEILD_GIFTS_ABI,
  },
  alfajores: {
    address: CONTRACT_ADDRESSES[44787].gifts,
    abi:     VEILD_GIFTS_ABI,
  },
} as const;

export const veildStaking = {
  celo: {
    address: CONTRACT_ADDRESSES[42220].staking,
    abi:     VEILD_STAKING_ABI,
  },
  alfajores: {
    address: CONTRACT_ADDRESSES[44787].staking,
    abi:     VEILD_STAKING_ABI,
  },
} as const;

export const veildGovernance = {
  celo: {
    address: CONTRACT_ADDRESSES[42220].governance,
    abi:     VEILD_GOVERNANCE_ABI,
  },
  alfajores: {
    address: CONTRACT_ADDRESSES[44787].governance,
    abi:     VEILD_GOVERNANCE_ABI,
  },
} as const;
