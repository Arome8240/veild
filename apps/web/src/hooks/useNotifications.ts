"use client";

import { useState, useCallback } from "react";
import { MAX_NOTIFICATIONS } from "@/constants/config";

export type NotifType = "tip" | "sub" | "message" | "gift" | "auction" | "governance";

export interface Notification {
  id:        string;
  type:      NotifType;
  title:     string;
  body:      string;
  timestamp: number;
  read:      boolean;
  href?:     string;
}

let _counter = 0;
function newId() { return `notif-${++_counter}`; }

/**
 * Client-side notification store for on-chain events surfaced as toasts.
 * Hooks into wagmi's useWatchContractEvent externally — this module just
 * manages the display queue.
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const push = useCallback((n: Omit<Notification, "id" | "timestamp" | "read">) => {
    setNotifications((prev) => [
      { ...n, id: newId(), timestamp: Date.now(), read: false },
      ...prev.slice(0, MAX_NOTIFICATIONS - 1),
    ]);
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    push,
    markRead,
    markAllRead,
    dismiss,
  };
}
