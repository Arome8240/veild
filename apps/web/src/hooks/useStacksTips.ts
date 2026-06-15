"use client";

import { useState, useCallback } from "react";
import {
  fetchCallReadOnlyFunction,
  cvToJSON,
  principalCV,
  uintCV,
  stringUtf8CV,
  AnchorMode,
} from "@stacks/transactions";
import { STACKS_MAINNET } from "@stacks/network";
import { openContractCall } from "@stacks/connect";

const TIPS_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_STACKS_TIPS_ADDRESS ?? "";
const TIPS_CONTRACT_NAME = "veild-tips";

const network = STACKS_MAINNET;

export function useStacksTips() {
  const [isLoading, setIsLoading] = useState(false);

  const getCreatorEarnings = useCallback(
    async (creator: string): Promise<bigint> => {
      setIsLoading(true);
      try {
        const result = await fetchCallReadOnlyFunction({
          contractAddress: TIPS_CONTRACT_ADDRESS,
          contractName:    TIPS_CONTRACT_NAME,
          functionName:    "get-creator-earnings",
          functionArgs:    [principalCV(creator)],
          senderAddress:   TIPS_CONTRACT_ADDRESS,
          network,
        });
        const json = cvToJSON(result);
        return BigInt(json.value ?? 0);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const getPlatformFeeBps = useCallback(async (): Promise<number> => {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: TIPS_CONTRACT_ADDRESS,
      contractName:    TIPS_CONTRACT_NAME,
      functionName:    "get-platform-fee-bps",
      functionArgs:    [],
      senderAddress:   TIPS_CONTRACT_ADDRESS,
      network,
    });
    const json = cvToJSON(result);
    return parseInt(json.value ?? "300");
  }, []);

  /**
   * Send `amountMicroStx` micro-STX to `creator` with an optional message.
   * Opens the Stacks wallet popup for signing.
   */
  const sendTip = useCallback(
    (
      creator:        string,
      amountMicroStx: bigint,
      message:        string,
      onSuccess?:     () => void,
      onCancel?:      () => void,
    ) => {
      openContractCall({
        contractAddress: TIPS_CONTRACT_ADDRESS,
        contractName:    TIPS_CONTRACT_NAME,
        functionName:    "send-tip",
        functionArgs: [
          principalCV(creator),
          uintCV(amountMicroStx),
          stringUtf8CV(message.slice(0, 280)),
        ],
        network,
        anchorMode: AnchorMode.Any,
        onFinish:   () => onSuccess?.(),
        onCancel:   () => onCancel?.(),
      });
    },
    [],
  );

  return {
    isLoading,
    getCreatorEarnings,
    getPlatformFeeBps,
    sendTip,
  };
}
