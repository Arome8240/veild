"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { WagmiProvider, createConfig, http, useConnect } from "wagmi";
import { celo } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// ─── Wagmi config ─────────────────────────────────────────────────────────────
// Single chain (Celo mainnet). Injected connector covers MiniPay and any
// browser wallet. No WalletConnect needed — Veild runs primarily inside MiniPay.

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
// When the app loads inside MiniPay, auto-connect without showing any modal.
// window.ethereum.isMiniPay is set by MiniPay's injected provider.

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

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <MiniPayAutoConnect />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
