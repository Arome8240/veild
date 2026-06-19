"use client";

import { formatEther, type Address } from "viem";
import { useAuction, useIsAuctionActive } from "@/hooks/useAuction";

interface Props {
  auctionId:  bigint;
  onBid?:     (_auctionId: bigint, _amount: bigint) => void;
  onClaim?:   (_auctionId: bigint) => void;
  viewer?:    Address;
}

export function AuctionCard({ auctionId, onBid, onClaim, viewer }: Props) {
  const { data: auction } = useAuction(auctionId);
  const { data: active }  = useIsAuctionActive(auctionId);

  if (!auction) return null;

  const endsAt        = new Date(Number(auction.endTime) * 1000);
  const currentBidETH = formatEther(auction.highestBid);
  const isWinner      = viewer && auction.highestBidder === viewer;
  const ended         = !active;
  const claimed       = auction.claimed;

  return (
    <article className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-zinc-500">Auction #{auctionId.toString()}</p>
          <h3 className="font-semibold leading-tight">{auction.label}</h3>
        </div>
        <span
          aria-label={`Auction status: ${active ? "Live" : "Ended"}`}
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            active ? "text-blue-400 bg-blue-400/10" : "text-zinc-400 bg-zinc-400/10"
          }`}
        >
          {active ? "Live" : "Ended"}
        </span>
      </header>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500">Current bid</p>
          <p className="text-lg font-bold">{currentBidETH} CELO</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">Closes</p>
          <p className="text-sm">{endsAt.toLocaleString()}</p>
        </div>
      </div>

      {active && onBid && (
        <button
          type="button"
          onClick={() => onBid(auctionId, auction.highestBid + auction.highestBid / 10n)}
          aria-label={`Place bid: ${formatEther(auction.highestBid + auction.highestBid / 10n)} CELO (+10%)`}
          className="w-full rounded-lg bg-purple-500/20 py-2 text-sm font-medium text-purple-300 hover:bg-purple-500/30 transition-colors"
        >
          Place Bid (+10%)
        </button>
      )}

      {ended && isWinner && !claimed && onClaim && (
        <button
          type="button"
          onClick={() => onClaim(auctionId)}
          className="w-full rounded-lg bg-green-500/20 py-2 text-sm font-medium text-green-300 hover:bg-green-500/30 transition-colors"
        >
          Claim Win
        </button>
      )}

      {claimed && (
        <p className="text-center text-xs text-zinc-500">Slot claimed</p>
      )}
    </article>
  );
}
