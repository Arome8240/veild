"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { WagmiProvider, createConfig, http, useConnect } from "wagmi";
import { celo } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { ChainContextProvider } from "@/lib/chain-context";
import { useStacksWallet } from "@/hooks/useStacksWallet";

// ─── Wagmi config ─────────────────────────────────────────────────────────────

export const wagmiConfig = createConfig({
  chains: [celo],
  connectors: [injected()],
  transports: {
    [celo.id]: http(
      process.env.NEXT_PUBLIC_CELO_RPC_URL ?? "https://forno.celo.org"
    ),
  },
  ssr: true,
});

const queryClient = new QueryClient();

// ─── MiniPay auto-connect ─────────────────────────────────────────────────────

function MiniPayAutoConnect() {
  const { connect, connectors } = useConnect();

  useEffect(() => {
    const ethereum = (window as Window & { ethereum?: { isMiniPay?: boolean } })
      .ethereum;

    if (ethereum?.isMiniPay) {
      const injectedConnector = connectors.find((c) => c.id === "injected");
      if (injectedConnector) {
        connect({ connector: injectedConnector });
      }
    }
  }, [connect, connectors]);

  return null;
}

// ─── Bridge: reads Stacks wallet state and feeds it into ChainContextProvider ──

function ChainBridge({ children }: { children: ReactNode }) {
  const { address: stacksAddress, isConnected: isStacksConnected } =
    useStacksWallet();

  return (
    <ChainContextProvider
      stacksAddress={stacksAddress}
      isStacksConnected={isStacksConnected}
    >
      {children}
    </ChainContextProvider>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <MiniPayAutoConnect />
        <ChainBridge>{children}</ChainBridge>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
