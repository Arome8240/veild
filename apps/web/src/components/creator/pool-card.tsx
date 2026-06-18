"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Clock, Loader2, Check, X, AlertCircle, Plus } from "lucide-react";
import { type Address } from "viem";
import { useVeildPools, usePoolContributions } from "@/hooks/usePools";
import { useMiniPay } from "@/hooks/useMiniPay";
import { formatCELO } from "@/lib/utils";
import { type Pool } from "@/lib/contracts";

interface PoolCardProps {
  pool: Pool;
  fanAddress?: Address;
}

const CONTRIB_AMOUNTS = [
  { label: "0.001", value: 1_000_000_000_000_000n },
  { label: "0.01",  value: 10_000_000_000_000_000n },
  { label: "0.05",  value: 50_000_000_000_000_000n },
  { label: "0.1",   value: 100_000_000_000_000_000n },
];

function timeLeft(deadline: bigint): string {
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (deadline <= now) return "Expired";
  const secs = Number(deadline - now);
  const days = Math.floor(secs / 86400);
  const hrs  = Math.floor((secs % 86400) / 3600);
  if (days > 0) return `${days}d ${hrs}h left`;
  const mins = Math.floor((secs % 3600) / 60);
  return `${hrs}h ${mins}m left`;
}

const STATUS_LABELS = ["Active", "Answered", "Expired", "Cancelled"] as const;

export function PoolCard({ pool, fanAddress }: PoolCardProps) {
  const { isConnected } = useMiniPay();
  const { contribute, isPending, isConfirming, isConfirmed, error, reset } = useVeildPools();
  const { data: contributions = [], refetch } = usePoolContributions(pool.id);

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(CONTRIB_AMOUNTS[0].value);

  const isBusy = isPending || isConfirming;
  const isActive = pool.status === 0;

  const handleOpen = useCallback(() => {
    reset();
    setOpen(true);
  }, [reset]);

  const handleClose = useCallback(() => {
    setOpen(false);
    reset();
    if (isConfirmed) refetch();
  }, [reset, isConfirmed, refetch]);

  const handleContribute = useCallback(() => {
    contribute(pool.id, amount);
  }, [contribute, pool.id, amount]);

  const contribCount = contributions.length;
  const statusLabel  = STATUS_LABELS[pool.status] ?? "Unknown";

  const userContrib = fanAddress
    ? contributions.find((c) => c.contributor.toLowerCase() === fanAddress.toLowerCase())
    : undefined;

  return (
    <>
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium leading-snug flex-1">{pool.question}</p>
          <span
            className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              pool.status === 0
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                : pool.status === 1
                ? "bg-primary/10 border-primary/25 text-primary"
                : "bg-muted border-border text-muted-foreground"
            }`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Answer (if answered) */}
        {pool.status === 1 && pool.answer && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
            <p className="text-[11px] text-muted-foreground mb-0.5">Answer</p>
            <p className="text-sm text-foreground">{pool.answer}</p>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" aria-hidden="true" />
            {contribCount} contributor{contribCount !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {timeLeft(pool.deadline)}
          </span>
          <span className="ml-auto font-semibold text-foreground">
            {formatCELO(pool.totalFunded)} CELO
          </span>
        </div>

        {/* User contribution badge */}
        {userContrib && !userContrib.refunded && (
          <p className="text-[10px] text-primary bg-primary/10 rounded-full px-2 py-0.5 w-fit">
            You contributed {formatCELO(userContrib.amount)} CELO
          </p>
        )}

        {/* Action */}
        {isActive && (
          <button
            onClick={handleOpen}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 py-2 rounded-xl transition-all"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Contribute
          </button>
        )}
      </div>

      {/* Contribute modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && handleClose()}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full bg-card border-t border-border rounded-t-3xl p-5 pb-10 max-w-lg mx-auto"
              role="dialog"
              aria-modal="true"
              aria-label="Contribute to question pool"
            >
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" aria-hidden="true" />

              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-base">Contribute to pool</h2>
                <button
                  onClick={handleClose}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{pool.question}</p>

              {isConfirmed ? (
                <div className="text-center py-6" role="status" aria-live="polite">
                  <Check className="w-10 h-10 text-green-400 mx-auto mb-2" aria-hidden="true" />
                  <p className="font-semibold text-green-400">Contributed!</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {formatCELO(amount)} CELO added to the pool.
                  </p>
                  <button onClick={handleClose} className="mt-4 text-primary text-sm hover:text-primary/80">
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Amount (CELO)</p>
                    <div className="grid grid-cols-4 gap-2">
                      {CONTRIB_AMOUNTS.map((a) => (
                        <button
                          key={a.label}
                          onClick={() => setAmount(a.value)}
                          className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                            amount === a.value
                              ? "bg-emerald-500 text-white border-emerald-500"
                              : "bg-card border-border text-foreground hover:border-ring"
                          }`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div role="alert" className="flex gap-2 bg-destructive/10 border border-destructive/25 rounded-xl px-3 py-2.5 mb-3">
                      <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
                      <p className="text-xs text-destructive">
                        {error.message?.slice(0, 100) ?? "Transaction failed"}
                      </p>
                    </div>
                  )}

                  {!isConnected && (
                    <p className="text-xs text-muted-foreground text-center mb-3">
                      Connect your wallet to contribute.
                    </p>
                  )}

                  <button
                    onClick={handleContribute}
                    disabled={isBusy || !isConnected}
                    aria-busy={isBusy}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-xl transition-all"
                  >
                    {isBusy ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Plus className="w-4 h-4" aria-hidden="true" />
                    )}
                    {isPending
                      ? "Confirm in wallet…"
                      : isConfirming
                      ? "Processing…"
                      : `Add ${formatCELO(amount)} CELO`}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
