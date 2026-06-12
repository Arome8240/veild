"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/connect-button";

interface Props {
  children:    React.ReactNode;
  message?:    string;
}

/**
 * Renders children only when a wallet is connected.
 * Shows a connect prompt otherwise.
 */
export function WalletGate({ children, message = "Connect your wallet to continue." }: Props) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 px-4 text-center">
        <span className="text-4xl" aria-hidden="true">🔐</span>
        <p className="text-sm text-zinc-400">{message}</p>
        <ConnectButton />
      </div>
    );
  }

  return <>{children}</>;
}
