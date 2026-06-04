"use client";

import { useMemo } from "react";
import type { IndexedMessage, InboxTab } from "@/types";
import type { Message } from "veild-sdk";

/**
 * Derives filtered + counted inbox messages from the raw on-chain array.
 * Keeps filtering logic out of the inbox page component.
 */
export function useMessageFilter(
  rawMessages: Message[],
  tab: InboxTab,
  searchQuery: string
) {
  const indexed: IndexedMessage[] = useMemo(
    () => rawMessages.map((m, index) => ({ ...m, index })),
    [rawMessages]
  );

  const visible = useMemo(() => {
    return indexed.filter((m) => {
      if (m.isArchived) return false;
      if (tab === "priority") return m.isPriority;
      if (tab === "unanswered") return !m.isAnswered;
      if (searchQuery.trim()) {
        return m.content.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [indexed, tab, searchQuery]);

  const counts = useMemo(
    () => ({
      all: indexed.filter((m) => !m.isArchived).length,
      priority: indexed.filter((m) => m.isPriority && !m.isArchived).length,
      unanswered: indexed.filter((m) => !m.isAnswered && !m.isArchived).length,
    }),
    [indexed]
  );

  return { visible, counts };
}
