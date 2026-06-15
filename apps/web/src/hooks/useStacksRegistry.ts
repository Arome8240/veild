"use client";

import { useState, useCallback } from "react";
import {
  fetchCallReadOnlyFunction,
  cvToJSON,
  stringUtf8CV,
  principalCV,
  uintCV,
  AnchorMode,
  type ClarityValue,
} from "@stacks/transactions";
import { STACKS_MAINNET } from "@stacks/network";
import { openContractCall } from "@stacks/connect";

const REGISTRY_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_STACKS_REGISTRY_ADDRESS ?? "";
const REGISTRY_CONTRACT_NAME = "veild-registry";

const network = STACKS_MAINNET;

export interface StacksCreator {
  username:   string;
  name:       string;
  bio:        string;
  avatarCid:  string;
  category:   string;
  joinedAt:   number;
  isVerified: boolean;
  isActive:   boolean;
}

function parseCreatorCV(cv: any): StacksCreator | null {
  if (!cv || cv.type !== "tuple") return null;
  const v = cv.value;
  return {
    username:   v["username"]?.value    ?? "",
    name:       v["name"]?.value        ?? "",
    bio:        v["bio"]?.value         ?? "",
    avatarCid:  v["avatar-cid"]?.value  ?? "",
    category:   v["category"]?.value    ?? "",
    joinedAt:   parseInt(v["joined-at"]?.value ?? "0"),
    isVerified: v["is-verified"]?.value === true,
    isActive:   v["is-active"]?.value   === true,
  };
}

export function useStacksRegistry() {
  const [isLoading, setIsLoading] = useState(false);

  const getCreator = useCallback(
    async (principal: string): Promise<StacksCreator | null> => {
      setIsLoading(true);
      try {
        const result = await fetchCallReadOnlyFunction({
          contractAddress: REGISTRY_CONTRACT_ADDRESS,
          contractName:    REGISTRY_CONTRACT_NAME,
          functionName:    "get-creator",
          functionArgs:    [principalCV(principal)],
          senderAddress:   REGISTRY_CONTRACT_ADDRESS,
          network,
        });
        const json = cvToJSON(result);
        return json.value ? parseCreatorCV(json.value) : null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const getCreatorByUsername = useCallback(
    async (username: string): Promise<StacksCreator | null> => {
      setIsLoading(true);
      try {
        const result = await fetchCallReadOnlyFunction({
          contractAddress: REGISTRY_CONTRACT_ADDRESS,
          contractName:    REGISTRY_CONTRACT_NAME,
          functionName:    "get-creator-by-username",
          functionArgs:    [stringUtf8CV(username)],
          senderAddress:   REGISTRY_CONTRACT_ADDRESS,
          network,
        });
        const json = cvToJSON(result);
        return json.value ? parseCreatorCV(json.value) : null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const isRegistered = useCallback(async (principal: string): Promise<boolean> => {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: REGISTRY_CONTRACT_ADDRESS,
      contractName:    REGISTRY_CONTRACT_NAME,
      functionName:    "is-registered",
      functionArgs:    [principalCV(principal)],
      senderAddress:   REGISTRY_CONTRACT_ADDRESS,
      network,
    });
    const json = cvToJSON(result);
    return json.value === true;
  }, []);

  const register = useCallback(
    (
      username:  string,
      name:      string,
      bio:       string,
      avatarCid: string,
      category:  string,
      onSuccess?: () => void,
      onCancel?:  () => void,
    ) => {
      openContractCall({
        contractAddress: REGISTRY_CONTRACT_ADDRESS,
        contractName:    REGISTRY_CONTRACT_NAME,
        functionName:    "register",
        functionArgs:    [
          stringUtf8CV(username),
          stringUtf8CV(name),
          stringUtf8CV(bio),
          stringUtf8CV(avatarCid),
          stringUtf8CV(category),
        ],
        network,
        anchorMode: AnchorMode.Any,
        onFinish:   () => onSuccess?.(),
        onCancel:   () => onCancel?.(),
      });
    },
    [],
  );

  const updateProfile = useCallback(
    (
      name:       string,
      bio:        string,
      avatarCid:  string,
      category:   string,
      onSuccess?: () => void,
    ) => {
      openContractCall({
        contractAddress: REGISTRY_CONTRACT_ADDRESS,
        contractName:    REGISTRY_CONTRACT_NAME,
        functionName:    "update-profile",
        functionArgs:    [
          stringUtf8CV(name),
          stringUtf8CV(bio),
          stringUtf8CV(avatarCid),
          stringUtf8CV(category),
        ],
        network,
        anchorMode: AnchorMode.Any,
        onFinish:   () => onSuccess?.(),
        onCancel:   () => {},
      });
    },
    [],
  );

  return {
    isLoading,
    getCreator,
    getCreatorByUsername,
    isRegistered,
    register,
    updateProfile,
  };
}
