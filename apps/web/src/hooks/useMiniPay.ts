"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { METAMASK_DOWNLOAD_URL } from "@/constants/config";

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

  const connectWallet = useCallback(() => {
    if (!hasWallet) {
      window.open(METAMASK_DOWNLOAD_URL, "_blank");
      return;
    }
    connect({ connector: injected() });
  }, [hasWallet, connect]);

  return {
    isMiniPay,
    hasWallet,
    address,
    isConnected,
    isConnecting,
    connectError,
    connectWallet,
    disconnect,
  };
}
