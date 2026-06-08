"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Loader2, Check, X, AlertCircle } from "lucide-react";
import { type Address } from "viem";
import { useVeildTips } from "@/hooks/useTips";
import { useMiniPay } from "@/hooks/useMiniPay";
import { formatCELO } from "@/lib/utils";

const AMOUNTS = [
  { label: "0.01",  value: 10_000_000_000_000_000n },
  { label: "0.05",  value: 50_000_000_000_000_000n },
  { label: "0.1",   value: 100_000_000_000_000_000n },
  { label: "0.5",   value: 500_000_000_000_000_000n },
];

interface TipButtonProps {
  creatorAddress: Address;
  creatorName: string;
}

export function TipButton({ creatorAddress, creatorName }: TipButtonProps) {
  const { isConnected } = useMiniPay();
  const { sendTip, isPending, isConfirming, isConfirmed, error, reset } = useVeildTips();

  const [open, setOpen]     = useState(false);
  const [amount, setAmount] = useState(AMOUNTS[0].value);
  const [message, setMessage] = useState("");

  function handleOpen() {
    reset();
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    reset();
    setMessage("");
    setAmount(AMOUNTS[0].value);
  }

  function handleTip() {
    sendTip(creatorAddress, message, amount);
  }

  const isBusy = isPending || isConfirming;

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-xs font-medium bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/25 text-pink-400 px-3 py-1.5 rounded-full transition-all"
        aria-label={`Tip ${creatorName}`}
      >
        <Heart className="w-3 h-3" aria-hidden="true" />
        Tip
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
              aria-label="Send a tip"
            >
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" aria-hidden="true" />

              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-base">
                  Tip {creatorName.split(" ")[0]}
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
                  <p className="font-semibold text-green-400">Tip sent!</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {formatCELO(amount)} CELO sent to {creatorName.split(" ")[0]}
                  </p>
                  <button onClick={handleClose} className="mt-4 text-primary text-sm hover:text-primary/80">
                    Close
                  </button>
                </div>
              ) : (
                <>
                  {/* Amount selector */}
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Amount (CELO)</p>
                    <div className="grid grid-cols-4 gap-2">
                      {AMOUNTS.map((a) => (
                        <button
                          key={a.label}
                          onClick={() => setAmount(a.value)}
                          className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                            amount === a.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card border-border text-foreground hover:border-ring"
                          }`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional message */}
                  <div className="mb-4">
                    <label htmlFor="tip-message" className="text-xs text-muted-foreground mb-1 block">
                      Message (optional)
                    </label>
                    <input
                      id="tip-message"
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value.slice(0, 140))}
                      placeholder={`Show some love to ${creatorName.split(" ")[0]}…`}
                      className="w-full bg-background border border-input focus:border-ring rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors"
                    />
                    <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
                      {message.length}/140
                    </p>
                  </div>

                  {/* Error */}
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
                      Connect your wallet to send a tip.
                    </p>
                  )}

                  <button
                    onClick={handleTip}
                    disabled={isBusy || !isConnected}
                    aria-busy={isBusy}
                    className="w-full flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-400 disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-xl transition-all"
                  >
                    {isBusy ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Heart className="w-4 h-4" aria-hidden="true" />
                    )}
                    {isPending ? "Confirm in wallet…" : isConfirming ? "Processing…" : `Send ${formatCELO(amount)} CELO`}
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
