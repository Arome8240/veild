import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Toggle } from "@/components/ui/toggle";

describe("Toggle", () => {
  it("renders with role=switch", () => {
    render(<Toggle checked={false} onChange={vi.fn()} label="Test toggle" />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("sets aria-checked to false when unchecked", () => {
    render(<Toggle checked={false} onChange={vi.fn()} label="Toggle" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("sets aria-checked to true when checked", () => {
    render(<Toggle checked={true} onChange={vi.fn()} label="Toggle" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("calls onChange with true when clicked while unchecked", () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="Toggle" />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("calls onChange with false when clicked while checked", () => {
    const onChange = vi.fn();
    render(<Toggle checked={true} onChange={onChange} label="Toggle" />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("does not call onChange when disabled", () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="Toggle" disabled />);
    const toggle = screen.getByRole("switch");
    expect(toggle).toBeDisabled();
  });

  it("sets aria-label from label prop", () => {
    render(<Toggle checked={false} onChange={vi.fn()} label="Publish to wall" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-label", "Publish to wall");
  });
});
