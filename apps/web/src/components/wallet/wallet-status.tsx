"use client";

import { Loader2, Wallet } from "lucide-react";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMiniPay } from "@/hooks/useMiniPay";

/**
 * Displays the current wallet connection state in a compact banner.
 * Three variants: MiniPay connected, wallet connected, not connected.
 */
export function WalletStatus() {
  const {
    isMiniPay,
    address,
    isConnected,
    isConnecting,
    connectWallet,
    disconnect,
    hasWallet,
    connectError,
  } = useMiniPay();

  if (isMiniPay && isConnected) {
    return (
      <div
        role="status"
        aria-label={`Connected via MiniPay: ${address}`}
        className="flex items-center gap-2.5 px-3 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl"
      >
        <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-green-400 leading-tight">MiniPay</p>
          <p className="text-[10px] text-green-400/60 font-mono leading-tight truncate">
            {address}
          </p>
        </div>
      </div>
    );
  }

  if (!isMiniPay && isConnected) {
    return (
      <div
        role="status"
        aria-label={`Wallet connected: ${address}`}
        className="flex items-center gap-2.5 px-3 py-2.5 bg-primary/10 border border-primary/20 rounded-xl"
      >
        <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-primary leading-tight">Wallet connected</p>
          <p className="text-[10px] text-primary/60 font-mono leading-tight truncate">
            {address}
          </p>
        </div>
        <button
          type="button"
          onClick={disconnect}
          className="text-[10px] text-muted-foreground hover:text-foreground shrink-0 transition-colors"
          aria-label="Disconnect wallet"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={connectWallet}
        disabled={isConnecting}
        aria-label={
          hasWallet
            ? "Connect wallet to send on-chain"
            : "Install MetaMask to send on-chain"
        }
        className={cn(
          "w-full flex items-center justify-center gap-2 px-3 py-2.5",
          "bg-muted/50 hover:bg-muted border border-border hover:border-border/80",
          "rounded-xl transition-all disabled:opacity-60 text-xs font-medium text-muted-foreground"
        )}
      >
        {isConnecting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Wallet className="w-3.5 h-3.5" aria-hidden="true" />
        )}
        {isConnecting
          ? "Connecting…"
          : hasWallet
          ? "Connect wallet to send on-chain"
          : "Install MetaMask to send on-chain"}
      </button>
      {connectError && (
        <p role="alert" className="text-xs text-destructive mt-1.5 px-1">
          {connectError.message?.slice(0, 90)}
        </p>
      )}
    </div>
  );
}
