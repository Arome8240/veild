import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/hooks/useSubscriptions", () => ({
  useVeildSubscriptions: vi.fn(),
  useIsSubscribed:       vi.fn(),
  useCreatorTiers:       vi.fn(),
}));
vi.mock("@/hooks/useMiniPay", () => ({
  useMiniPay: vi.fn(),
}));

import { SubscribeButton } from "@/components/creator/subscribe-button";
import { useVeildSubscriptions, useIsSubscribed, useCreatorTiers } from "@/hooks/useSubscriptions";
import { useMiniPay } from "@/hooks/useMiniPay";

const CREATOR = "0x1234567890abcdef1234567890abcdef12345678" as const;
const FAN     = "0xabcdefabcdefabcdefabcdefabcdefabcdef1234" as const;
const NAME    = "Bob Streamer";

const TIERS = [
  { pricePerMonth: 10_000_000_000_000_000n, label: "Basic", isActive: true },
  { pricePerMonth: 50_000_000_000_000_000n, label: "Pro",   isActive: true },
];

function mockAll(overrides: {
  subscribe?: ReturnType<typeof vi.fn>;
  isPending?: boolean;
  isConfirming?: boolean;
  isConfirmed?: boolean;
  error?: { message: string } | null;
  tiers?: typeof TIERS;
  isSubbed?: boolean;
  connected?: boolean;
} = {}) {
  const {
    subscribe = vi.fn(),
    isPending = false,
    isConfirming = false,
    isConfirmed = false,
    error = null,
    tiers = TIERS,
    isSubbed = false,
    connected = true,
  } = overrides;

  (useVeildSubscriptions as ReturnType<typeof vi.fn>).mockReturnValue({
    subscribe,
    createTier: vi.fn(),
    updateTierPrice: vi.fn(),
    deactivateTier: vi.fn(),
    claimSubEarnings: vi.fn(),
    isPending,
    isConfirming,
    isConfirmed,
    error,
    reset: vi.fn(),
  });
  (useIsSubscribed as ReturnType<typeof vi.fn>).mockReturnValue({ data: isSubbed, refetch: vi.fn() });
  (useCreatorTiers as ReturnType<typeof vi.fn>).mockReturnValue({ data: tiers });
  (useMiniPay as ReturnType<typeof vi.fn>).mockReturnValue({
    isConnected: connected,
    address: connected ? FAN : undefined,
    connectWallet: vi.fn(),
  });
}

beforeEach(() => mockAll());

describe("SubscribeButton", () => {
  it("renders Subscribe button trigger when not subscribed", () => {
    render(<SubscribeButton creatorAddress={CREATOR} creatorName={NAME} fanAddress={FAN} />);
    expect(screen.getByRole("button", { name: `Subscribe to ${NAME}` })).toBeInTheDocument();
  });

  it("shows 'Subscribed' label when already subscribed", () => {
    mockAll({ isSubbed: true });
    render(<SubscribeButton creatorAddress={CREATOR} creatorName={NAME} fanAddress={FAN} />);
    expect(screen.getByRole("button", { name: `Subscribed to ${NAME}` })).toBeInTheDocument();
  });

  it("renders nothing when no active tiers", () => {
    mockAll({ tiers: [] });
    const { container } = render(
      <SubscribeButton creatorAddress={CREATOR} creatorName={NAME} fanAddress={FAN} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("opens the bottom-sheet dialog on click", () => {
    render(<SubscribeButton creatorAddress={CREATOR} creatorName={NAME} fanAddress={FAN} />);
    fireEvent.click(screen.getByRole("button", { name: `Subscribe to ${NAME}` }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows tier list with labels and prices in dialog", () => {
    render(<SubscribeButton creatorAddress={CREATOR} creatorName={NAME} fanAddress={FAN} />);
    fireEvent.click(screen.getByRole("button", { name: `Subscribe to ${NAME}` }));
    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
  });

  it("shows renewal notice when already subscribed", () => {
    mockAll({ isSubbed: true });
    render(<SubscribeButton creatorAddress={CREATOR} creatorName={NAME} fanAddress={FAN} />);
    fireEvent.click(screen.getByRole("button", { name: `Subscribed to ${NAME}` }));
    expect(screen.getByText(/Renewing will extend/i)).toBeInTheDocument();
  });

  it("shows error alert when error is set", () => {
    mockAll({ error: { message: "User rejected the request" } });
    render(<SubscribeButton creatorAddress={CREATOR} creatorName={NAME} fanAddress={FAN} />);
    fireEvent.click(screen.getByRole("button", { name: `Subscribe to ${NAME}` }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("shows wallet connection notice when disconnected", () => {
    mockAll({ connected: false });
    render(<SubscribeButton creatorAddress={CREATOR} creatorName={NAME} fanAddress={FAN} />);
    fireEvent.click(screen.getByRole("button", { name: `Subscribe to ${NAME}` }));
    expect(screen.getByText(/Connect your wallet/i)).toBeInTheDocument();
  });

  it("subscribe button is disabled when disconnected", () => {
    mockAll({ connected: false });
    render(<SubscribeButton creatorAddress={CREATOR} creatorName={NAME} fanAddress={FAN} />);
    fireEvent.click(screen.getByRole("button", { name: `Subscribe to ${NAME}` }));
    expect(screen.getByRole("button", { name: /Subscribe —/i })).toBeDisabled();
  });

  it("shows confirming state", () => {
    mockAll({ isConfirming: true });
    render(<SubscribeButton creatorAddress={CREATOR} creatorName={NAME} fanAddress={FAN} />);
    fireEvent.click(screen.getByRole("button", { name: `Subscribe to ${NAME}` }));
    expect(screen.getByText("Processing…")).toBeInTheDocument();
  });

  it("shows confirmed success state", () => {
    mockAll({ isConfirmed: true });
    render(<SubscribeButton creatorAddress={CREATOR} creatorName={NAME} fanAddress={FAN} />);
    fireEvent.click(screen.getByRole("button", { name: `Subscribe to ${NAME}` }));
    expect(screen.getByText("Subscribed!")).toBeInTheDocument();
  });

  it("closes dialog on X button click", () => {
    render(<SubscribeButton creatorAddress={CREATOR} creatorName={NAME} fanAddress={FAN} />);
    fireEvent.click(screen.getByRole("button", { name: `Subscribe to ${NAME}` }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("filters out inactive tiers", () => {
    mockAll({
      tiers: [
        { pricePerMonth: 10_000_000_000_000_000n, label: "Basic", isActive: true },
        { pricePerMonth: 50_000_000_000_000_000n, label: "Inactive Tier", isActive: false },
      ],
    });
    render(<SubscribeButton creatorAddress={CREATOR} creatorName={NAME} fanAddress={FAN} />);
    fireEvent.click(screen.getByRole("button", { name: `Subscribe to ${NAME}` }));
    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.queryByText("Inactive Tier")).not.toBeInTheDocument();
  });
});
