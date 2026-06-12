"use client";

import { useEffect } from "react";
import { useWatchContractEvent } from "wagmi";
import { veildTips, veildMessages, veildSubscriptions, veildGifts } from "@/lib/contracts";
import { useNotifications } from "./useNotifications";
import type { Address } from "viem";

/**
 * Subscribes to on-chain events for the connected creator and surfaces them
 * as client-side notifications via useNotifications.
 */
export function useWatchEvents(creator: Address | undefined) {
  const { push } = useNotifications();

  useWatchContractEvent({
    ...veildTips.celo,
    eventName: "TipSent",
    args: { creator },
    onLogs(logs) {
      logs.forEach((log) => {
        const { args } = log as { args?: { amount?: bigint } };
        push({
          type:  "tip",
          title: "New tip received!",
          body:  args?.amount ? `${Number(args.amount) / 1e18} CELO` : "Someone tipped you",
          href:  "/",
        });
      });
    },
    enabled: !!creator,
  });

  useWatchContractEvent({
    ...veildMessages.celo,
    eventName: "MessageSent",
    args: { creator },
    onLogs(logs) {
      logs.forEach(() => {
        push({
          type:  "message",
          title: "New message",
          body:  "Someone sent you an anonymous message",
          href:  "/inbox",
        });
      });
    },
    enabled: !!creator,
  });

  useWatchContractEvent({
    ...veildSubscriptions.celo,
    eventName: "Subscribed",
    args: { creator },
    onLogs(logs) {
      logs.forEach(() => {
        push({
          type:  "sub",
          title: "New subscriber!",
          body:  "Someone just subscribed to your profile",
          href:  "/",
        });
      });
    },
    enabled: !!creator,
  });

  useWatchContractEvent({
    ...veildGifts.celo,
    eventName: "GiftSent",
    args: { creator },
    onLogs(logs) {
      logs.forEach(() => {
        push({
          type:  "gift",
          title: "New gift received!",
          body:  "Someone sent you a virtual gift",
          href:  "/",
        });
      });
    },
    enabled: !!creator,
  });
}
