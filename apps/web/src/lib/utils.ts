import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatEther } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string, start = 6, end = 4) {
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}…${address.slice(-end)}`;
}

export function formatCELO(wei: bigint, decimals = 4): string {
  const num = parseFloat(formatEther(wei));
  if (num === 0) return "0";
  if (num < 0.0001) return "<0.0001";
  return num.toFixed(decimals).replace(/\.?0+$/, "");
}

export function formatNumber(n: number | bigint): string {
  const num = typeof n === "bigint" ? Number(n) : n;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
  return num.toString();
}

/** Accepts on-chain unix timestamps (seconds) or JS ms timestamps. */
export function timeAgo(timestamp: number | bigint): string {
  const ts = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
  const nowSec = Math.floor(Date.now() / 1000);
  // detect JS ms timestamp (> year 2001 in seconds = 1_000_000_000)
  const sec = ts > 1_000_000_000_000 ? Math.floor(ts / 1000) : ts;
  const diff = nowSec - sec;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/** Returns a real image URL only for actual uploads (IPFS or https).
 *  Returns null when no real image is stored, so the UI shows initials. */
export function resolveAvatar(avatarCID: string, name?: string): string {
  if (!avatarCID || avatarCID === "") {
    const seed = encodeURIComponent(name ?? "anon");
    return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
  }
  if (avatarCID.startsWith("http")) return avatarCID;
  if (avatarCID.startsWith("Qm") || avatarCID.startsWith("bafy")) {
    const gateway =
      process.env.NEXT_PUBLIC_PINATA_GATEWAY ?? "https://ipfs.io/ipfs";
    return `${gateway}/${avatarCID}`;
  }
  const seed = encodeURIComponent(name ?? avatarCID);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
}

/** Extract up to 2 uppercase initials from a display name. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Pastel-safe palette — readable with white text at all contrast levels. */
const AVATAR_PALETTE = [
  "#7c3aed", // violet
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
  "#14b8a6", // teal
] as const;

/** Deterministic color from any seed string (name, address, username). */
export function getAvatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i);
    h |= 0;
  }
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}
