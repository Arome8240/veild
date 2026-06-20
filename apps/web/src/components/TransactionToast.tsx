"use client";

import { useEffect, useState } from "react";
import { TRANSACTION_TOAST_AUTO_MS } from "@/constants/config";
import type { Hash } from "viem";

interface Props {
  hash?:        Hash;
  isPending?:   boolean;
  isConfirming?: boolean;
  isConfirmed?:  boolean;
  error?:       Error | null;
  onClose?:     () => void;
}

type Status = "idle" | "pending" | "confirming" | "confirmed" | "error";

export function TransactionToast({
  hash,
  isPending,
  isConfirming,
  isConfirmed,
  error,
  onClose,
}: Props) {
  const [show, setShow]   = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (isPending)    { setStatus("pending");    setShow(true);  return; }
    if (isConfirming) { setStatus("confirming"); setShow(true);  return; }
    if (isConfirmed)  { setStatus("confirmed");  setShow(true);  return; }
    if (error)        { setStatus("error");      setShow(true);  return; }
    setStatus("idle");
  }, [isPending, isConfirming, isConfirmed, error]);

  useEffect(() => {
    if (status === "confirmed" || status === "error") {
      const t = setTimeout(() => { setShow(false); onClose?.(); }, TRANSACTION_TOAST_AUTO_MS);
      return () => clearTimeout(t);
    }
  }, [status, onClose]);

  if (!show || status === "idle") return null;

  const MAP: Record<Status, { icon: string; label: string; color: string }> = {
    idle:       { icon: "",  label: "",                    color: ""                      },
    pending:    { icon: "⏳", label: "Awaiting signature…", color: "border-yellow-400/30" },
    confirming: { icon: "🔄", label: "Confirming on-chain…", color: "border-blue-400/30" },
    confirmed:  { icon: "✅", label: "Transaction confirmed", color: "border-green-400/30"},
    error:      { icon: "❌", label: error?.message?.slice(0, 60) ?? "Transaction failed", color: "border-red-400/30" },
  };

  const { icon, label, color } = MAP[status];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border ${color} bg-zinc-900 px-4 py-3 shadow-2xl text-sm max-w-xs w-full`}
    >
      <span aria-hidden="true">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {hash && status === "confirmed" && (
        <a
          href={`https://celoscan.io/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 underline shrink-0"
        >
          View
        </a>
      )}
    </div>
  );
}
