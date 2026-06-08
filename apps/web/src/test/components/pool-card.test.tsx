import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/hooks/usePools", () => ({
  useVeildPools: vi.fn(),
  usePoolContributions: vi.fn(),
}));
vi.mock("@/hooks/useMiniPay", () => ({
  useMiniPay: vi.fn(),
}));

import { PoolCard } from "@/components/creator/pool-card";
import { useVeildPools, usePoolContributions } from "@/hooks/usePools";
import { useMiniPay } from "@/hooks/useMiniPay";
import type { Pool } from "@/lib/contracts";

const FAN    = "0xabcdefabcdefabcdefabcdefabcdefabcdef1234" as const;
const nowSec = BigInt(Math.floor(Date.now() / 1000));

function makePool(overrides: Partial<Pool> = {}): Pool {
  return {
    id:         0n,
    creator:    "0x1234567890abcdef1234567890abcdef12345678",
    question:   "What is your favourite programming language?",
    totalFunded: 50_000_000_000_000_000n,
    deadline:   nowSec + 86400n,
    status:     0,
    answer:     "",
    answeredAt: 0n,
    ...overrides,
  };
}

function mockAll(overrides: {
  contribute?: ReturnType<typeof vi.fn>;
  isPending?: boolean;
  isConfirming?: boolean;
  isConfirmed?: boolean;
  error?: { message: string } | null;
  contributions?: { contributor: string; amount: bigint; refunded: boolean }[];
  connected?: boolean;
} = {}) {
  const {
    contribute = vi.fn(),
    isPending = false,
    isConfirming = false,
    isConfirmed = false,
    error = null,
    contributions = [],
    connected = true,
  } = overrides;

  (useVeildPools as ReturnType<typeof vi.fn>).mockReturnValue({
    contribute,
    createPool: vi.fn(),
    answerPool: vi.fn(),
    markExpired: vi.fn(),
    claimRefund: vi.fn(),
    isPending,
    isConfirming,
    isConfirmed,
    error,
    reset: vi.fn(),
  });
  (usePoolContributions as ReturnType<typeof vi.fn>).mockReturnValue({
    data: contributions,
    refetch: vi.fn(),
  });
  (useMiniPay as ReturnType<typeof vi.fn>).mockReturnValue({
    isConnected: connected,
    address: connected ? FAN : undefined,
    connectWallet: vi.fn(),
  });
}

beforeEach(() => mockAll());

describe("PoolCard", () => {
  it("renders the pool question", () => {
    render(<PoolCard pool={makePool()} />);
    expect(screen.getByText(/favourite programming language/i)).toBeInTheDocument();
  });

  it("shows Active badge for active pool", () => {
    render(<PoolCard pool={makePool({ status: 0 })} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows Answered badge for answered pool", () => {
    render(<PoolCard pool={makePool({ status: 1 })} />);
    expect(screen.getByText("Answered")).toBeInTheDocument();
  });

  it("shows Expired badge for expired pool", () => {
    render(<PoolCard pool={makePool({ status: 2 })} />);
    expect(screen.getByText("Expired")).toBeInTheDocument();
  });

  it("shows the pool answer when answered", () => {
    render(
      <PoolCard
        pool={makePool({ status: 1, answer: "TypeScript, obviously!" })}
      />
    );
    expect(screen.getByText("TypeScript, obviously!")).toBeInTheDocument();
  });

  it("shows contributor count", () => {
    mockAll({
      contributions: [
        { contributor: "0xaaa", amount: 10_000_000_000_000_000n, refunded: false },
        { contributor: "0xbbb", amount: 20_000_000_000_000_000n, refunded: false },
      ],
    });
    render(<PoolCard pool={makePool()} />);
    expect(screen.getByText(/2 contributors/i)).toBeInTheDocument();
  });

  it("shows '1 contributor' (singular) for one contributor", () => {
    mockAll({
      contributions: [
        { contributor: "0xaaa", amount: 10_000_000_000_000_000n, refunded: false },
      ],
    });
    render(<PoolCard pool={makePool()} />);
    expect(screen.getByText(/1 contributor$/i)).toBeInTheDocument();
  });

  it("shows the Contribute button for active pool", () => {
    render(<PoolCard pool={makePool({ status: 0 })} />);
    expect(screen.getByRole("button", { name: /Contribute/i })).toBeInTheDocument();
  });

  it("does not show Contribute button for non-active pool", () => {
    render(<PoolCard pool={makePool({ status: 1 })} />);
    expect(screen.queryByRole("button", { name: /Contribute/i })).not.toBeInTheDocument();
  });

  it("shows user contribution badge when fan has contributed", () => {
    mockAll({
      contributions: [
        { contributor: FAN.toLowerCase(), amount: 10_000_000_000_000_000n, refunded: false },
      ],
    });
    render(<PoolCard pool={makePool()} fanAddress={FAN} />);
    expect(screen.getByText(/You contributed/i)).toBeInTheDocument();
  });

  it("opens contribute modal on button click", () => {
    render(<PoolCard pool={makePool()} />);
    fireEvent.click(screen.getByRole("button", { name: /Contribute/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows 4 contribution amount presets in modal", () => {
    render(<PoolCard pool={makePool()} />);
    fireEvent.click(screen.getByRole("button", { name: /Contribute/i }));
    expect(screen.getByText("0.001")).toBeInTheDocument();
    expect(screen.getByText("0.01")).toBeInTheDocument();
    expect(screen.getByText("0.05")).toBeInTheDocument();
    expect(screen.getByText("0.1")).toBeInTheDocument();
  });

  it("shows wallet connect notice when disconnected", () => {
    mockAll({ connected: false });
    render(<PoolCard pool={makePool()} />);
    fireEvent.click(screen.getByRole("button", { name: /Contribute/i }));
    expect(screen.getByText(/Connect your wallet/i)).toBeInTheDocument();
  });

  it("shows error alert in modal when error is set", () => {
    mockAll({ error: { message: "Transaction reverted" } });
    render(<PoolCard pool={makePool()} />);
    fireEvent.click(screen.getByRole("button", { name: /Contribute/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("shows confirmed success state in modal", () => {
    mockAll({ isConfirmed: true });
    render(<PoolCard pool={makePool()} />);
    fireEvent.click(screen.getByRole("button", { name: /Contribute/i }));
    expect(screen.getByText("Contributed!")).toBeInTheDocument();
  });

  it("closes modal on X click", () => {
    render(<PoolCard pool={makePool()} />);
    fireEvent.click(screen.getByRole("button", { name: /Contribute/i }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
