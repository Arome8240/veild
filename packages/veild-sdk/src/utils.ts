/**
 * Formatting and conversion utilities for Veild contracts.
 */

/** Convert basis points to a human-readable percentage string. */
export function bpsToPercent(bps: bigint): string {
  return `${Number(bps) / 100}%`;
}

/** Format a bigint CELO amount (in wei) to a human-readable string. */
export function formatCELO(wei: bigint, decimals = 4): string {
  const units  = Number(wei) / 1e18;
  return `${units.toFixed(decimals)} CELO`;
}

/** Abbreviate a large number — 1234 → "1.2K", 1234567 → "1.2M". */
export function abbreviateNumber(n: bigint | number): string {
  const v = typeof n === "bigint" ? Number(n) : n;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

/** Return a relative-time string — "2 hours ago", "just now", etc. */
export function timeAgo(timestampSeconds: bigint | number): string {
  const ts = typeof timestampSeconds === "bigint" ? Number(timestampSeconds) : timestampSeconds;
  const diffMs = Date.now() - ts * 1000;
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60)          return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)          return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)            return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30)             return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12)           return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/** Convert an IPFS CID to a gateway URL. */
export function ipfsToHttp(cid: string, gateway = "https://ipfs.io/ipfs"): string {
  if (!cid) return "";
  if (cid.startsWith("http")) return cid;
  return `${gateway}/${cid}`;
}

/** Shorten an Ethereum address — "0x1234…5678". */
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}
