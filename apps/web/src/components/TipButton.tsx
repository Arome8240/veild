"use client";

import { useState } from "react";
import { parseEther, type Address } from "viem";

const QUICK_AMOUNTS = [0.01, 0.05, 0.1, 0.5] as const;

interface Props {
  recipient: Address;
  onTip:     (recipient: Address, amount: bigint, message?: string) => void;
  isPending?: boolean;
}

export function TipButton({ recipient, onTip, isPending }: Props) {
  const [open, setOpen]       = useState(false);
  const [amount, setAmount]   = useState("");
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const parsed = parseEther(amount || "0");
    if (parsed <= 0n) return;
    onTip(recipient, parsed, message.trim() || undefined);
    setOpen(false);
    setAmount("");
    setMessage("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-yellow-400/20 px-4 py-2 text-sm font-medium text-yellow-300 hover:bg-yellow-400/30 transition-colors"
      >
        Tip
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tip-modal-title"
        >
          <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl border border-white/10 bg-zinc-900 p-5 space-y-4">
            <h2 id="tip-modal-title" className="font-semibold text-center">Send a Tip</h2>

            <div className="grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAmount(String(a))}
                  aria-pressed={amount === String(a)}
                  className={`rounded-xl py-2 text-sm font-medium transition-colors ${
                    amount === String(a)
                      ? "bg-yellow-400/30 text-yellow-300"
                      : "border border-white/10 text-zinc-400 hover:bg-white/5"
                  }`}
                >
                  {a} CELO
                </button>
              ))}
            </div>

            <label htmlFor="tip-amount" className="sr-only">Custom amount in CELO</label>
            <input
              id="tip-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Custom amount (CELO)"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
            />

            <label htmlFor="tip-message" className="sr-only">Message (optional)</label>
            <input
              id="tip-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message (optional)"
              maxLength={100}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-zinc-500 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isPending || !amount || Number(amount) <= 0}
                className="flex-1 rounded-xl bg-yellow-400 py-2.5 text-sm font-medium text-black hover:bg-yellow-300 disabled:opacity-40 transition-colors"
              >
                {isPending ? "Sending…" : "Send Tip"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
