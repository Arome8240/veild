/**
 * Shared protocol constants — mirrors Solidity contract constants.
 * Use these in UI and SDK logic instead of magic numbers.
 */

/** Platform fee in basis points — 3% */
export const PLATFORM_FEE_BPS = 300n;

/** Platform fee for gifts — 5% */
export const GIFTS_PLATFORM_FEE_BPS = 500n;

/** Minimum bid increment for auctions — 5% */
export const MIN_BID_INCREMENT_BPS = 500n;

/** Staking cooldown period — 7 days in seconds */
export const STAKING_COOLDOWN_SECONDS = 604_800n;

/** Referral reward per referred creator — 0.001 CELO */
export const REFERRAL_REWARD_WEI = 1_000_000_000_000_000n;

/** Governance: default quorum votes */
export const GOV_DEFAULT_QUORUM = 10n;

/** Governance: min voting period in seconds (1 day) */
export const GOV_MIN_VOTING_PERIOD = 86_400n;

/** Governance: max voting period in seconds (30 days) */
export const GOV_MAX_VOTING_PERIOD = 2_592_000n;

/** Basis points denominator */
export const BPS_DENOMINATOR = 10_000n;

/** Convert BPS to a multiplier — e.g. fee(300n) → 0.03 */
export function bpsFee(bps: bigint, amount: bigint): bigint {
  return (amount * bps) / BPS_DENOMINATOR;
}

/** Net amount after platform fee — e.g. netAmount(1_000_000n, 300n) */
export function netAmount(gross: bigint, feeBps: bigint): bigint {
  return gross - bpsFee(feeBps, gross);
}
