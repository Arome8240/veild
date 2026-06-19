"use client";

import { useState, useCallback } from "react";
import { formatEther, type Address } from "viem";
import { useGiftTypeCount, useGiftType } from "@/hooks/useGifts";
import type { GiftType } from "@/lib/contracts";

const GIFT_EMOJI = ["🌹", "🚀", "👑", "💎", "📣"];

interface GiftButtonProps {
  id:       number;
  onSelect: (_id: number, _price: bigint) => void;
}

function GiftButton({ id, onSelect }: GiftButtonProps) {
  const { data } = useGiftType(BigInt(id));
  const gift     = data as GiftType | undefined;

  if (!gift || !gift.active) return null;

  return (
    <button
      type="button"
      onClick={() => onSelect(id, gift.price)}
      aria-label={`Send ${gift.name} gift — ${formatEther(gift.price)} CELO`}
      className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-colors"
    >
      <span className="text-2xl" aria-hidden="true">{GIFT_EMOJI[id] ?? "🎁"}</span>
      <span className="text-xs font-medium" aria-hidden="true">{gift.name}</span>
      <span className="text-xs text-zinc-500" aria-hidden="true">{formatEther(gift.price)} CELO</span>
    </button>
  );
}

interface Props {
  recipient: Address;
  onGift:    (_giftTypeId: number, _price: bigint, _message: string) => void;
}

export function GiftPicker({ recipient: _recipient, onGift }: Props) {
  const [message, setMessage]   = useState("");
  const [selected, setSelected] = useState<{ id: number; price: bigint } | null>(null);

  const { data: countRaw } = useGiftTypeCount();
  const count              = Number(countRaw ?? 5n);

  const handleSelect = useCallback((id: number, price: bigint) => {
    setSelected({ id, price });
  }, []);

  const handleSend = useCallback(() => {
    if (!selected) return;
    onGift(selected.id, selected.price, message);
    setMessage("");
    setSelected(null);
  }, [selected, onGift, message]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {Array.from({ length: count }, (_, i) => (
          <GiftButton key={i} id={i} onSelect={handleSelect} />
        ))}
      </div>

      {selected && (
        <div className="space-y-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message (optional, max 100 chars)"
            aria-label="Gift message (optional)"
            maxLength={100}
            rows={2}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
          />
          <button
            type="button"
            onClick={handleSend}
            className="w-full rounded-lg bg-pink-500/20 py-2 text-sm font-medium text-pink-300 hover:bg-pink-500/30 transition-colors"
          >
            Send {GIFT_EMOJI[selected.id] ?? "🎁"} · {formatEther(selected.price)} CELO
          </button>
        </div>
      )}
    </div>
  );
}
