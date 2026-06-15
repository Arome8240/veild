"use client";

import { useState, useCallback } from "react";
import {
  fetchCallReadOnlyFunction,
  cvToJSON,
  stringUtf8CV,
  principalCV,
  uintCV,
  trueCV,
  falseCV,
  AnchorMode,
} from "@stacks/transactions";
import { STACKS_MAINNET } from "@stacks/network";
import { openContractCall } from "@stacks/connect";

const REGISTRY_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_STACKS_REGISTRY_ADDRESS ?? "";
const REGISTRY_CONTRACT_NAME = "veild-registry";

const network = STACKS_MAINNET;

export interface StacksCreator {
  username:      string;
  name:          string;
  bio:           string;
  avatarCid:     string;
  category:      string;
  joinedAt:      number;
  totalMessages: number;
  isVerified:    boolean;
  isActive:      boolean;
}

function parseCreatorCV(cv: any): StacksCreator | null {
  if (!cv || cv.type !== "tuple") return null;
  const v = cv.value;
  return {
    username:      v["username"]?.value       ?? "",
    name:          v["name"]?.value           ?? "",
    bio:           v["bio"]?.value            ?? "",
    avatarCid:     v["avatar-cid"]?.value     ?? "",
    category:      v["category"]?.value       ?? "",
    joinedAt:      parseInt(v["joined-at"]?.value      ?? "0"),
    totalMessages: parseInt(v["total-messages"]?.value ?? "0"),
    isVerified:    v["is-verified"]?.value === true,
    isActive:      v["is-active"]?.value   === true,
  };
}

// ── Read helpers ──────────────────────────────────────────────────────────────

async function readOnly(functionName: string, functionArgs: any[]) {
  return fetchCallReadOnlyFunction({
    contractAddress: REGISTRY_CONTRACT_ADDRESS,
    contractName:    REGISTRY_CONTRACT_NAME,
    functionName,
    functionArgs,
    senderAddress:   REGISTRY_CONTRACT_ADDRESS,
    network,
  });
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useStacksRegistry() {
  const [isLoading, setIsLoading] = useState(false);

  // ── Reads ────────────────────────────────────────────────────────────────────

  const getCreator = useCallback(async (addr: string): Promise<StacksCreator | null> => {
    setIsLoading(true);
    try {
      const result = await readOnly("get-creator", [principalCV(addr)]);
      const json   = cvToJSON(result);
      return json.value ? parseCreatorCV(json.value) : null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCreatorByUsername = useCallback(async (username: string): Promise<StacksCreator | null> => {
    setIsLoading(true);
    try {
      const result = await readOnly("get-creator-by-username", [stringUtf8CV(username)]);
      const json   = cvToJSON(result);
      return json.value ? parseCreatorCV(json.value) : null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isRegistered = useCallback(async (addr: string): Promise<boolean> => {
    const result = await readOnly("is-registered", [principalCV(addr)]);
    return cvToJSON(result).value === true;
  }, []);

  const getTotalCreators = useCallback(async (): Promise<number> => {
    const result = await readOnly("get-total-creators", []);
    return parseInt(cvToJSON(result).value ?? "0");
  }, []);

  const getRegistrationFee = useCallback(async (): Promise<bigint> => {
    const result = await readOnly("get-registration-fee", []);
    return BigInt(cvToJSON(result).value ?? 0);
  }, []);

  /** Fetch the principal at sequential index `i` — use with getTotalCreators for pagination. */
  const getCreatorAtIndex = useCallback(async (i: number): Promise<string | null> => {
    const result = await readOnly("get-creator-at-index", [uintCV(i)]);
    const json   = cvToJSON(result);
    return json.value ?? null;
  }, []);

  // ── Writes (open wallet popup) ───────────────────────────────────────────────

  const register = useCallback((
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
  }, []);

  const updateProfile = useCallback((
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
  }, []);

  // ── Owner writes ─────────────────────────────────────────────────────────────

  const setVerified = useCallback((
    target:    string,
    verified:  boolean,
    onSuccess?: () => void,
  ) => {
    openContractCall({
      contractAddress: REGISTRY_CONTRACT_ADDRESS,
      contractName:    REGISTRY_CONTRACT_NAME,
      functionName:    "set-verified",
      functionArgs:    [principalCV(target), verified ? trueCV() : falseCV()],
      network,
      anchorMode: AnchorMode.Any,
      onFinish:   () => onSuccess?.(),
      onCancel:   () => {},
    });
  }, []);

  const deactivateCreator = useCallback((
    target:    string,
    onSuccess?: () => void,
  ) => {
    openContractCall({
      contractAddress: REGISTRY_CONTRACT_ADDRESS,
      contractName:    REGISTRY_CONTRACT_NAME,
      functionName:    "deactivate-creator",
      functionArgs:    [principalCV(target)],
      network,
      anchorMode: AnchorMode.Any,
      onFinish:   () => onSuccess?.(),
      onCancel:   () => {},
    });
  }, []);

  return {
    isLoading,
    // reads
    getCreator,
    getCreatorByUsername,
    isRegistered,
    getTotalCreators,
    getRegistrationFee,
    getCreatorAtIndex,
    // writes
    register,
    updateProfile,
    // owner
    setVerified,
    deactivateCreator,
  };
}
