"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

/**
 * useMiniPay
 *
 * Detects whether the app is running inside MiniPay and auto-connects the
 * injected wallet when it is. Safe to call on any page — does nothing when
 * running in a regular browser.
 *
 * MiniPay sets `window.ethereum.isMiniPay = true` and injects a standard
 * EIP-1193 provider. Transactions are intercepted by MiniPay and downgraded
 * to legacy format automatically (MiniPay does not support EIP-1559).
 */
export function useMiniPay() {
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  // Avoid SSR mismatch
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const ethereum = (window as Window & { ethereum?: { isMiniPay?: boolean } })
      .ethereum;

    if (ethereum?.isMiniPay) {
      setIsMiniPay(true);
      // Auto-connect immediately — no modal needed inside MiniPay
      if (!isConnected) {
        connect({ connector: injected() });
      }
    }
  }, [mounted, isConnected, connect]);

  function connectWallet() {
    connect({ connector: injected() });
  }

  return {
    isMiniPay,
    address,
    isConnected,
    isConnecting,
    connectWallet,
    disconnect,
  };
}
