"use client";

import { useCountdown } from "@/hooks/useCountdown";

interface Props {
  targetUnixSec: bigint | number;
  className?:    string;
}

export function CountdownBadge({ targetUnixSec, className = "" }: Props) {
  const { days, hours, minutes, seconds, expired } = useCountdown(targetUnixSec);

  if (expired) {
    return (
      <span className={`text-xs text-zinc-500 ${className}`}>Ended</span>
    );
  }

  const parts = [];
  if (days > 0)    parts.push(`${days}d`);
  if (hours > 0)   parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  if (days === 0)  parts.push(`${String(seconds).padStart(2, "0")}s`);

  return (
    <span className={`font-mono text-xs tabular-nums ${className}`}>
      {parts.join(" ")}
    </span>
  );
}
