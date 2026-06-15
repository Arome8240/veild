"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAccount } from "wagmi";

export type SupportedChain = "celo" | "stacks";

interface ChainCtx {
  activeChain:  SupportedChain;
  setChain:     (chain: SupportedChain) => void;
  /** EVM address (when on Celo) */
  celoAddress:  `0x${string}` | undefined;
  /** Stacks principal (when on Stacks) */
  stacksAddress: string | undefined;
  /** The relevant address for the active chain */
  address:      string | undefined;
  isConnected:  boolean;
}

const ChainContext = createContext<ChainCtx | null>(null);

interface Props {
  children:       ReactNode;
  stacksAddress?: string;
  isStacksConnected?: boolean;
}

export function ChainContextProvider({ children, stacksAddress, isStacksConnected }: Props) {
  const [activeChain, setActiveChain] = useState<SupportedChain>("celo");
  const { address: celoAddress, isConnected: isCeloConnected } = useAccount();

  const setChain = useCallback((chain: SupportedChain) => {
    setActiveChain(chain);
  }, []);

  const isConnected =
    activeChain === "celo" ? isCeloConnected : Boolean(isStacksConnected);

  const address =
    activeChain === "celo"
      ? celoAddress
      : stacksAddress;

  return (
    <ChainContext.Provider
      value={{
        activeChain,
        setChain,
        celoAddress,
        stacksAddress,
        address,
        isConnected,
      }}
    >
      {children}
    </ChainContext.Provider>
  );
}

export function useChain(): ChainCtx {
  const ctx = useContext(ChainContext);
  if (!ctx) throw new Error("useChain must be used inside ChainContextProvider");
  return ctx;
}
