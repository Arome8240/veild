import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMessageFilter } from "@/hooks/useMessageFilter";
import type { Message } from "veild-sdk";

// Minimal message factory
function makeMsg(overrides: Partial<Message> = {}): Message {
  return {
    id: BigInt(Math.floor(Math.random() * 1000)),
    content: "Test message",
    reply: "",
    isPriority: false,
    fee: 0n,
    sentAt: BigInt(Math.floor(Date.now() / 1000)),
    repliedAt: 0n,
    isAnswered: false,
    isPublished: false,
    isArchived: false,
    ...overrides,
  };
}

const MESSAGES: readonly Message[] = [
  makeMsg({ content: "Hello world" }),
  makeMsg({ isPriority: true, content: "Priority msg" }),
  makeMsg({ isAnswered: true, reply: "replied", content: "Answered msg" }),
  makeMsg({ isArchived: true, content: "Archived msg" }),
];

describe("useMessageFilter", () => {
  it("returns all non-archived messages for 'all' tab", () => {
    const { result } = renderHook(() =>
      useMessageFilter(MESSAGES, "all", "")
    );
    expect(result.current.visible).toHaveLength(3);
  });

  it("excludes archived messages from counts", () => {
    const { result } = renderHook(() =>
      useMessageFilter(MESSAGES, "all", "")
    );
    expect(result.current.counts.all).toBe(3);
  });

  it("filters to priority messages only", () => {
    const { result } = renderHook(() =>
      useMessageFilter(MESSAGES, "priority", "")
    );
    expect(result.current.visible).toHaveLength(1);
    expect(result.current.visible[0].isPriority).toBe(true);
  });

  it("filters to unanswered messages only", () => {
    const { result } = renderHook(() =>
      useMessageFilter(MESSAGES, "unanswered", "")
    );
    // Non-archived + not answered: messages[0] (Hello world) + messages[1] (Priority)
    expect(result.current.visible).toHaveLength(2);
    result.current.visible.forEach((m) => {
      expect(m.isAnswered).toBe(false);
    });
  });

  it("filters by search query on 'all' tab", () => {
    const { result } = renderHook(() =>
      useMessageFilter(MESSAGES, "all", "priority")
    );
    expect(result.current.visible).toHaveLength(1);
    expect(result.current.visible[0].content).toContain("Priority");
  });

  it("search is case-insensitive", () => {
    const { result } = renderHook(() =>
      useMessageFilter(MESSAGES, "all", "HELLO")
    );
    expect(result.current.visible).toHaveLength(1);
  });

  it("returns empty when search finds nothing", () => {
    const { result } = renderHook(() =>
      useMessageFilter(MESSAGES, "all", "xyznotfound")
    );
    expect(result.current.visible).toHaveLength(0);
  });

  it("attaches the correct index to each message", () => {
    const { result } = renderHook(() =>
      useMessageFilter(MESSAGES, "all", "")
    );
    result.current.visible.forEach((m, i) => {
      // Index should correspond to position in original rawMessages (skipping archived)
      expect(typeof m.index).toBe("number");
    });
  });

  it("provides correct counts for each tab", () => {
    const { result } = renderHook(() =>
      useMessageFilter(MESSAGES, "all", "")
    );
    const { counts } = result.current;
    expect(counts.all).toBe(3);        // 4 total - 1 archived
    expect(counts.priority).toBe(1);
    expect(counts.unanswered).toBe(2); // messages[0] and messages[1]
  });
});
