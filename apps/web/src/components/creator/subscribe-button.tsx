"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Loader2, Check, X, AlertCircle, Zap } from "lucide-react";
import { type Address } from "viem";
import { useVeildSubscriptions, useIsSubscribed, useCreatorTiers } from "@/hooks/useSubscriptions";
import { useMiniPay } from "@/hooks/useMiniPay";
import { formatCELO } from "@/lib/utils";

interface SubscribeButtonProps {
  creatorAddress: Address;
  creatorName: string;
  fanAddress?: Address;
}

export function SubscribeButton({ creatorAddress, creatorName, fanAddress }: SubscribeButtonProps) {
  const { isConnected } = useMiniPay();
  const { subscribe, isPending, isConfirming, isConfirmed, error, reset } = useVeildSubscriptions();

  const { data: tiers = [] } = useCreatorTiers(creatorAddress);
  const { data: isSubbed, refetch } = useIsSubscribed(
    creatorAddress,
    fanAddress
  );

  const [open, setOpen]         = useState(false);
  const [selectedTier, setSelectedTier] = useState(0);

  const activeTiers = useMemo(() => tiers.filter((t) => t.isActive), [tiers]);

  const handleOpen = useCallback(() => {
    reset();
    setOpen(true);
  }, [reset]);

  const handleClose = useCallback(() => {
    setOpen(false);
    reset();
    if (isConfirmed) refetch();
  }, [reset, isConfirmed, refetch]);

  const handleSubscribe = useCallback(() => {
    const tier = activeTiers[selectedTier];
    if (!tier) return;
    subscribe(creatorAddress, tier.id, tier.pricePerMonth);
  }, [activeTiers, selectedTier, subscribe, creatorAddress]);

  const isBusy = isPending || isConfirming;

  // Hide if no active tiers
  if (activeTiers.length === 0) return null;

  const label = isSubbed ? "Subscribed" : "Subscribe";

  return (
    <>
      <button
        onClick={handleOpen}
        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all border ${
          isSubbed
            ? "bg-primary/10 border-primary/25 text-primary"
            : "bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/25 text-violet-400"
        }`}
        aria-label={`${label} to ${creatorName}`}
      >
        {isSubbed ? (
          <Check className="w-3 h-3" aria-hidden="true" />
        ) : (
          <Star className="w-3 h-3" aria-hidden="true" />
        )}
        {label}
      </button>

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
              aria-label="Subscribe to creator"
            >
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" aria-hidden="true" />

              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-base">
                  Subscribe to {creatorName.split(" ")[0]}
                </h2>
                <button
                  onClick={handleClose}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              {isConfirmed ? (
                <div className="text-center py-6" role="status" aria-live="polite">
                  <Check className="w-10 h-10 text-green-400 mx-auto mb-2" aria-hidden="true" />
                  <p className="font-semibold text-green-400">
                    {isSubbed ? "Subscription renewed!" : "Subscribed!"}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Your access lasts 30 days.
                  </p>
                  <button onClick={handleClose} className="mt-4 text-primary text-sm hover:text-primary/80">
                    Close
                  </button>
                </div>
              ) : (
                <>
                  {/* Tier selector */}
                  <div className="space-y-2 mb-5">
                    {activeTiers.map((tier, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedTier(i)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                          selectedTier === i
                            ? "bg-primary/10 border-primary/40"
                            : "bg-card border-border hover:border-ring/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Zap
                            className={`w-4 h-4 ${selectedTier === i ? "text-primary" : "text-muted-foreground"}`}
                            aria-hidden="true"
                          />
                          <span className="text-sm font-medium">{tier.label}</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">
                          {formatCELO(tier.pricePerMonth)} CELO<span className="text-muted-foreground font-normal">/mo</span>
                        </span>
                      </button>
                    ))}
                  </div>

                  {isSubbed && (
                    <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2.5 mb-3">
                      <Check className="w-4 h-4 text-primary" aria-hidden="true" />
                      <p className="text-xs text-primary">
                        You&apos;re already subscribed. Renewing will extend your access by 30 more days.
                      </p>
                    </div>
                  )}

                  {error && (
                    <div role="alert" className="flex gap-2 bg-destructive/10 border border-destructive/25 rounded-xl px-3 py-2.5 mb-3">
                      <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
                      <p className="text-xs text-destructive leading-relaxed">
                        {error.message?.slice(0, 100) ?? "Transaction failed"}
                      </p>
                    </div>
                  )}

                  {!isConnected && (
                    <p className="text-xs text-muted-foreground text-center mb-3">
                      Connect your wallet to subscribe.
                    </p>
                  )}

                  <button
                    onClick={handleSubscribe}
                    disabled={isBusy || !isConnected || activeTiers.length === 0}
                    aria-busy={isBusy}
                    className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-xl transition-all"
                  >
                    {isBusy ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Star className="w-4 h-4" aria-hidden="true" />
                    )}
                    {isPending
                      ? "Confirm in wallet…"
                      : isConfirming
                      ? "Processing…"
                      : isSubbed
                      ? `Renew — ${formatCELO(activeTiers[selectedTier]?.pricePerMonth ?? 0n)} CELO`
                      : `Subscribe — ${formatCELO(activeTiers[selectedTier]?.pricePerMonth ?? 0n)} CELO`}
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
