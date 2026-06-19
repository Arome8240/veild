"use client";

import { useState, useCallback, useEffect } from "react";
import { Loader2, Plus, AlertCircle, Check } from "lucide-react";
import { type Address } from "viem";
import { useVeildPools } from "@/hooks/usePools";
import { formatCELO } from "@/lib/utils";
import { MAX_POOL_QUESTION_CHARS } from "@/constants/config";

const DURATION_OPTIONS = [
  { label: "3 days",   value: BigInt(3 * 86400) },
  { label: "7 days",   value: BigInt(7 * 86400) },
  { label: "14 days",  value: BigInt(14 * 86400) },
  { label: "30 days",  value: BigInt(30 * 86400) },
];

const AMOUNT_OPTIONS = [
  { label: "0.01 CELO", value: 10_000_000_000_000_000n },
  { label: "0.05 CELO", value: 50_000_000_000_000_000n },
  { label: "0.1 CELO",  value: 100_000_000_000_000_000n },
  { label: "0.5 CELO",  value: 500_000_000_000_000_000n },
];

interface CreatePoolFormProps {
  creatorAddress: Address;
  onCreated?: () => void;
}

export function CreatePoolForm({ creatorAddress, onCreated }: CreatePoolFormProps) {
  const { createPool, isPending, isConfirming, isConfirmed, error, reset } =
    useVeildPools();

  const [question, setQuestion] = useState("");
  const [duration, setDuration] = useState(DURATION_OPTIONS[1].value);
  const [amount,   setAmount]   = useState(AMOUNT_OPTIONS[0].value);

  const isBusy = isPending || isConfirming;

  useEffect(() => {
    if (isConfirmed) {
      onCreated?.();
      reset();
      setQuestion("");
    }
  }, [isConfirmed, onCreated, reset]);

  const handleCreate = useCallback(() => {
    if (!question.trim()) return;
    createPool(creatorAddress, question.trim(), duration, amount);
  }, [createPool, creatorAddress, question, duration, amount]);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <h3 className="text-sm font-semibold">Open a question pool</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Fans contribute CELO to fund answers to specific questions.
        </p>
      </div>

      <div className="p-4 space-y-3">
        {isConfirmed ? (
          <div className="text-center py-4" role="status" aria-live="polite">
            <Check className="w-8 h-8 text-green-400 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-semibold text-green-400">Pool created!</p>
            <p className="text-xs text-muted-foreground mt-1">Fans can now contribute.</p>
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="pool-question" className="text-xs text-muted-foreground mb-1 block">
                Question
              </label>
              <textarea
                id="pool-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value.slice(0, MAX_POOL_QUESTION_CHARS))}
                placeholder="What question do you want your fans to fund?"
                rows={3}
                className="w-full bg-background border border-input focus:border-ring rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none transition-colors"
              />
              <p className="text-[10px] text-muted-foreground text-right mt-0.5">
                {question.length}/{MAX_POOL_QUESTION_CHARS}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="pool-duration" className="text-xs text-muted-foreground mb-1 block">
                  Duration
                </label>
                <select
                  id="pool-duration"
                  value={duration.toString()}
                  onChange={(e) => setDuration(BigInt(e.target.value))}
                  className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm outline-none"
                >
                  {DURATION_OPTIONS.map((o) => (
                    <option key={o.label} value={o.value.toString()}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pool-amount" className="text-xs text-muted-foreground mb-1 block">
                  Initial amount
                </label>
                <select
                  id="pool-amount"
                  value={amount.toString()}
                  onChange={(e) => setAmount(BigInt(e.target.value))}
                  className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm outline-none"
                >
                  {AMOUNT_OPTIONS.map((o) => (
                    <option key={o.label} value={o.value.toString()}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div role="alert" className="flex gap-2 bg-destructive/10 border border-destructive/25 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs text-destructive">{error.message?.slice(0, 100) ?? "Failed"}</p>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded-xl px-3 py-2">
              <span>You send (initial)</span>
              <span className="font-semibold text-foreground">{formatCELO(amount)} CELO</span>
            </div>

            <button
              type="button"
              onClick={handleCreate}
              disabled={isBusy || !question.trim()}
              aria-busy={isBusy}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-xl transition-all"
            >
              {isBusy ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="w-4 h-4" aria-hidden="true" />
              )}
              {isPending ? "Confirm in wallet…" : isConfirming ? "Creating…" : "Create pool"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
