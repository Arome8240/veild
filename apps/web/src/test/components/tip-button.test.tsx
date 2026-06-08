import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

// Must mock before importing the component
vi.mock("@/hooks/useTips", () => ({
  useVeildTips: vi.fn(),
}));
vi.mock("@/hooks/useMiniPay", () => ({
  useMiniPay: vi.fn(),
}));

import { TipButton } from "@/components/creator/tip-button";
import { useVeildTips } from "@/hooks/useTips";
import { useMiniPay } from "@/hooks/useMiniPay";

const CREATOR = "0x1234567890abcdef1234567890abcdef12345678" as const;
const NAME    = "Alice Creator";

function mockTips(overrides = {}) {
  (useVeildTips as ReturnType<typeof vi.fn>).mockReturnValue({
    sendTip: vi.fn(),
    claimTipEarnings: vi.fn(),
    isPending: false,
    isConfirming: false,
    isConfirmed: false,
    error: null,
    reset: vi.fn(),
    ...overrides,
  });
}

function mockWallet(connected = true) {
  (useMiniPay as ReturnType<typeof vi.fn>).mockReturnValue({
    isConnected: connected,
    address: connected ? "0xabc" : undefined,
    connectWallet: vi.fn(),
    isConnecting: false,
  });
}

beforeEach(() => {
  mockTips();
  mockWallet();
});

describe("TipButton", () => {
  it("renders the Tip button trigger", () => {
    render(<TipButton creatorAddress={CREATOR} creatorName={NAME} />);
    expect(screen.getByRole("button", { name: `Tip ${NAME}` })).toBeInTheDocument();
  });

  it("opens the bottom-sheet on click", () => {
    render(<TipButton creatorAddress={CREATOR} creatorName={NAME} />);
    fireEvent.click(screen.getByRole("button", { name: `Tip ${NAME}` }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows creator first name in dialog heading", () => {
    render(<TipButton creatorAddress={CREATOR} creatorName={NAME} />);
    fireEvent.click(screen.getByRole("button", { name: `Tip ${NAME}` }));
    expect(screen.getByText(/Tip Alice/i)).toBeInTheDocument();
  });

  it("renders 4 amount presets", () => {
    render(<TipButton creatorAddress={CREATOR} creatorName={NAME} />);
    fireEvent.click(screen.getByRole("button", { name: `Tip ${NAME}` }));
    expect(screen.getByText("0.01")).toBeInTheDocument();
    expect(screen.getByText("0.05")).toBeInTheDocument();
    expect(screen.getByText("0.1")).toBeInTheDocument();
    expect(screen.getByText("0.5")).toBeInTheDocument();
  });

  it("shows message input", () => {
    render(<TipButton creatorAddress={CREATOR} creatorName={NAME} />);
    fireEvent.click(screen.getByRole("button", { name: `Tip ${NAME}` }));
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("shows 'Connect your wallet' when disconnected", () => {
    mockWallet(false);
    render(<TipButton creatorAddress={CREATOR} creatorName={NAME} />);
    fireEvent.click(screen.getByRole("button", { name: `Tip ${NAME}` }));
    expect(screen.getByText(/Connect your wallet/i)).toBeInTheDocument();
  });

  it("send button is disabled when disconnected", () => {
    mockWallet(false);
    render(<TipButton creatorAddress={CREATOR} creatorName={NAME} />);
    fireEvent.click(screen.getByRole("button", { name: `Tip ${NAME}` }));
    const sendBtn = screen.getByRole("button", { name: /send/i });
    expect(sendBtn).toBeDisabled();
  });

  it("displays error message when error is set", () => {
    mockTips({ error: { message: "Insufficient balance for the transaction" } });
    render(<TipButton creatorAddress={CREATOR} creatorName={NAME} />);
    fireEvent.click(screen.getByRole("button", { name: `Tip ${NAME}` }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Insufficient balance/i)).toBeInTheDocument();
  });

  it("shows pending state when isPending", () => {
    mockTips({ isPending: true });
    render(<TipButton creatorAddress={CREATOR} creatorName={NAME} />);
    fireEvent.click(screen.getByRole("button", { name: `Tip ${NAME}` }));
    expect(screen.getByText(/Confirm in wallet/i)).toBeInTheDocument();
  });

  it("shows confirmed state after transaction", () => {
    mockTips({ isConfirmed: true });
    render(<TipButton creatorAddress={CREATOR} creatorName={NAME} />);
    fireEvent.click(screen.getByRole("button", { name: `Tip ${NAME}` }));
    expect(screen.getByText("Tip sent!")).toBeInTheDocument();
  });

  it("closes dialog when X button is clicked", () => {
    render(<TipButton creatorAddress={CREATOR} creatorName={NAME} />);
    fireEvent.click(screen.getByRole("button", { name: `Tip ${NAME}` }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("char counter shows 140/140 when message exceeds limit", async () => {
    render(<TipButton creatorAddress={CREATOR} creatorName={NAME} />);
    fireEvent.click(screen.getByRole("button", { name: `Tip ${NAME}` }));
    const input = screen.getByRole("textbox");
    const longText = "a".repeat(150);
    await act(async () => {
      fireEvent.change(input, { target: { value: longText } });
    });
    // The slice(0, 140) in onChange caps state at 140 chars
    expect(screen.getByText("140/140")).toBeInTheDocument();
  });
});
