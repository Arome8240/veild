"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export function useMiniPay() {
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();

  // SSR guard
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;

    const ethereum = (window as Window & { ethereum?: { isMiniPay?: boolean } })
      .ethereum;

    // Track whether any injected wallet is present
    setHasWallet(!!ethereum);

    if (ethereum?.isMiniPay) {
      setIsMiniPay(true);
      // Auto-connect silently — no modal inside MiniPay
      if (!isConnected) {
        connect({ connector: injected() });
      }
    }
  }, [mounted, isConnected, connect]);

  function connectWallet() {
    if (!hasWallet) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    connect({ connector: injected() });
  }

  // Short display form: 0x1234…5678
  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  return {
    isMiniPay,
    hasWallet,
    address,
    shortAddress,
    isConnected,
    isConnecting,
    connectError,
    connectWallet,
    disconnect,
  };
}
