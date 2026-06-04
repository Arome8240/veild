import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageCircle } from "lucide-react";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState icon={MessageCircle} title="No messages yet" />);
    expect(screen.getByText("No messages yet")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <EmptyState
        icon={MessageCircle}
        title="Empty"
        description="Share your link to receive messages"
      />
    );
    expect(
      screen.getByText("Share your link to receive messages")
    ).toBeInTheDocument();
  });

  it("does not render description when omitted", () => {
    const { queryByText } = render(
      <EmptyState icon={MessageCircle} title="Empty" />
    );
    expect(queryByText("Share your link")).toBeNull();
  });

  it("renders action when provided", () => {
    render(
      <EmptyState
        icon={MessageCircle}
        title="Empty"
        action={<button>Click me</button>}
      />
    );
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("has role=status for accessibility", () => {
    render(<EmptyState icon={MessageCircle} title="Empty" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
