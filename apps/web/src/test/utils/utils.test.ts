import { describe, it, expect } from "vitest";
import {
  cn,
  truncateAddress,
  formatCELO,
  formatNumber,
  timeAgo,
  resolveAvatar,
} from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("deduplicates conflicting tailwind classes", () => {
    // tailwind-merge keeps the last one
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });
});

describe("truncateAddress", () => {
  it("truncates long addresses", () => {
    const addr = "0x1234567890abcdef1234567890abcdef12345678";
    expect(truncateAddress(addr)).toBe("0x1234…5678");
  });

  it("does not truncate short strings", () => {
    expect(truncateAddress("0x1234")).toBe("0x1234");
  });

  it("respects custom start/end lengths", () => {
    const addr = "0x1234567890abcdef1234567890abcdef12345678";
    expect(truncateAddress(addr, 4, 4)).toBe("0x12…5678");
  });
});

describe("formatCELO", () => {
  it("formats zero", () => {
    expect(formatCELO(0n)).toBe("0");
  });

  it("formats sub-threshold as <0.0001", () => {
    expect(formatCELO(1n)).toBe("<0.0001");
  });

  it("formats 0.001 CELO correctly", () => {
    expect(formatCELO(BigInt("1000000000000000"))).toBe("0.001");
  });

  it("formats 1 CELO correctly", () => {
    expect(formatCELO(BigInt("1000000000000000000"))).toBe("1");
  });

  it("trims trailing zeros", () => {
    expect(formatCELO(BigInt("1500000000000000000"))).toBe("1.5");
  });
});

describe("formatNumber", () => {
  it("formats small numbers as-is", () => {
    expect(formatNumber(42)).toBe("42");
  });

  it("formats thousands with k suffix", () => {
    expect(formatNumber(1500)).toBe("1.5k");
  });

  it("formats millions with M suffix", () => {
    expect(formatNumber(2_000_000)).toBe("2.0M");
  });

  it("accepts bigint", () => {
    expect(formatNumber(1000n)).toBe("1.0k");
  });
});

describe("timeAgo", () => {
  const nowSec = Math.floor(Date.now() / 1000);

  it("returns 'just now' for very recent timestamps", () => {
    expect(timeAgo(nowSec - 5)).toBe("just now");
  });

  it("returns minutes for timestamps < 1 hour ago", () => {
    expect(timeAgo(nowSec - 120)).toBe("2m ago");
  });

  it("returns hours for timestamps < 1 day ago", () => {
    expect(timeAgo(nowSec - 7200)).toBe("2h ago");
  });

  it("returns days for old timestamps", () => {
    expect(timeAgo(nowSec - 172800)).toBe("2d ago");
  });

  it("handles bigint timestamps", () => {
    expect(timeAgo(BigInt(nowSec - 5))).toBe("just now");
  });

  it("handles JS millisecond timestamps", () => {
    const msTimestamp = Date.now() - 5000;
    expect(timeAgo(msTimestamp)).toBe("just now");
  });
});

describe("resolveAvatar", () => {
  it("uses DiceBear for empty CID", () => {
    const url = resolveAvatar("", "alice");
    expect(url).toContain("dicebear");
    expect(url).toContain("alice");
  });

  it("passes through full URLs unchanged", () => {
    const url = "https://example.com/avatar.png";
    expect(resolveAvatar(url)).toBe(url);
  });

  it("constructs IPFS gateway URL for bare CIDs", () => {
    const cid = "QmXyz123";
    const url = resolveAvatar(cid);
    expect(url).toContain("ipfs.io/ipfs");
    expect(url).toContain(cid);
  });
});
