"use client";

import { formatEther } from "viem";

interface Props {
  wei:        bigint;
  decimals?:  number;
  className?: string;
  showUnit?:  boolean;
}

export function CeloAmount({ wei, decimals = 4, className = "", showUnit = true }: Props) {
  const formatted = Number(formatEther(wei)).toFixed(decimals);

  return (
    <span className={className}>
      {formatted}
      {showUnit && <span className="ml-0.5 text-zinc-500"> CELO</span>}
    </span>
  );
}
