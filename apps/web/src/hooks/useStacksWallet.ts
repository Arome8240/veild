"use client";

import { useState, useCallback, useEffect } from "react";
import { showConnect, disconnect as stacksDisconnect } from "@stacks/connect";

const APP_DETAILS = {
  name: "Veild",
  icon: "https://veild.app/favicon.svg",
};

export interface StacksWalletState {
  address:     string | undefined;
  isConnected: boolean;
  connect:     () => void;
  disconnect:  () => void;
}

const STORAGE_KEY = "veild_stacks_address";

function readStored(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(STORAGE_KEY) ?? undefined;
}

export function useStacksWallet(): StacksWalletState {
  const [address, setAddress] = useState<string | undefined>(readStored);

  useEffect(() => {
    const stored = readStored();
    if (stored) setAddress(stored);
  }, []);

  const connect = useCallback(() => {
    showConnect({
      appDetails: APP_DETAILS,
      onFinish: (payload) => {
        const principal =
          payload.userSession?.loadUserData()?.profile?.stxAddress?.mainnet ??
          payload.userSession?.loadUserData()?.profile?.stxAddress?.testnet;
        if (principal) {
          setAddress(principal);
          localStorage.setItem(STORAGE_KEY, principal);
        }
      },
      onCancel: () => {},
    });
  }, []);

  const disconnect = useCallback(() => {
    stacksDisconnect();
    setAddress(undefined);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    address,
    isConnected: Boolean(address),
    connect,
    disconnect,
  };
}
