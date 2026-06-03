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

export function resolveAvatar(avatarCID: string, fallbackSeed?: string): string {
  if (!avatarCID)
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${fallbackSeed ?? "default"}`;
  if (avatarCID.startsWith("http")) return avatarCID;
  return `https://ipfs.io/ipfs/${avatarCID}`;
}
