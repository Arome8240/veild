"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Eye, Reply, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toggle } from "@/components/ui/toggle";
import { useVeildContracts } from "@/hooks/useVeildContracts";
import type { IndexedMessage } from "@/types";

interface ReplySheetProps {
  message: IndexedMessage;
  onClose: () => void;
}

/**
 * Bottom sheet for replying to a message on-chain.
 * Extracted from inbox/page.tsx.
 */
export function ReplySheet({ message, onClose }: ReplySheetProps) {
  const [reply, setReply]       = useState("");
  const [publishToWall, setPub] = useState(false);
  const { replyToMessage, isPending, isConfirming, isConfirmed, reset } =
    useVeildContracts();

  useEffect(() => {
    if (isConfirmed) {
      const t = setTimeout(() => { reset(); onClose(); }, 800);
      return () => clearTimeout(t);
    }
  }, [isConfirmed, onClose, reset]);

  const handleSubmit = useCallback(() => {
    if (!reply.trim()) return;
    replyToMessage(BigInt(message.index), reply, publishToWall);
  }, [replyToMessage, message.index, reply, publishToWall]);

  const isbusy = isPending || isConfirming;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="dialog"
        aria-modal="true"
        aria-label="Reply to message"
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="w-full bg-card border-t border-border rounded-t-3xl p-5 pb-10 max-h-[85vh] overflow-y-auto"
        >
          <div
            className="w-10 h-1 bg-border rounded-full mx-auto mb-5"
            aria-hidden="true"
          />

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-foreground">
              Reply on-chain
            </h2>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
              aria-label="Close reply sheet"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Original message */}
          <div className="bg-muted/50 border border-border rounded-xl px-3.5 py-3 mb-4">
            <p className="text-[10px] text-muted-foreground mb-1">Anonymous asked</p>
            <p className="text-foreground text-sm leading-relaxed line-clamp-3">
              &ldquo;{message.content}&rdquo;
            </p>
          </div>

          <label htmlFor="reply-textarea" className="sr-only">
            Your reply
          </label>
          <textarea
            id="reply-textarea"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Your reply…"
            rows={4}
            aria-label="Your reply to this message"
            className="w-full bg-background border border-input focus:border-ring rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none transition-colors leading-relaxed mb-3"
          />

          {/* Publish toggle */}
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border border-border rounded-xl mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              <span className="text-xs text-foreground">Publish to wall</span>
            </div>
            <Toggle
              checked={publishToWall}
              onChange={setPub}
              label="Publish reply to public wall"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!reply.trim() || isbusy || isConfirmed}
            aria-busy={isbusy}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isConfirmed ? (
              <><Check className="w-4 h-4" aria-hidden="true" /> Confirmed!</>
            ) : isbusy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                {isPending ? "Confirm in wallet…" : "Confirming…"}
              </>
            ) : (
              <><Reply className="w-4 h-4" aria-hidden="true" /> Send Reply</>
            )}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
