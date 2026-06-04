import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Priority</Badge>);
    expect(screen.getByText("Priority")).toBeInTheDocument();
  });

  it("applies default variant classes", () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText("Default");
    expect(badge.tagName).toBe("SPAN");
    expect(badge.className).toContain("rounded-full");
  });

  it("applies priority variant", () => {
    render(<Badge variant="priority">Priority</Badge>);
    const badge = screen.getByText("Priority");
    expect(badge.className).toContain("amber");
  });

  it("applies success variant", () => {
    render(<Badge variant="success">Published</Badge>);
    const badge = screen.getByText("Published");
    expect(badge.className).toContain("green");
  });

  it("applies custom className", () => {
    render(<Badge className="custom-class">Test</Badge>);
    const badge = screen.getByText("Test");
    expect(badge.className).toContain("custom-class");
  });
});
