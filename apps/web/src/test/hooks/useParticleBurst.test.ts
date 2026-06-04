import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useParticleBurst } from "@/hooks/useParticleBurst";
import { PARTICLE_COLORS, PARTICLE_DECAY_MS } from "@/constants/config";

describe("useParticleBurst", () => {
  it("starts with empty particles", () => {
    const { result } = renderHook(() => useParticleBurst());
    expect(result.current.particles).toHaveLength(0);
  });

  it("generates 12 particles on burst()", () => {
    const { result } = renderHook(() => useParticleBurst());
    act(() => { result.current.burst(); });
    expect(result.current.particles).toHaveLength(12);
  });

  it("each particle has id, x, and color from PARTICLE_COLORS", () => {
    const { result } = renderHook(() => useParticleBurst());
    act(() => { result.current.burst(); });
    result.current.particles.forEach((p) => {
      expect(typeof p.id).toBe("number");
      expect(typeof p.x).toBe("number");
      expect(PARTICLE_COLORS).toContain(p.color);
    });
  });

  it("clears particles after PARTICLE_DECAY_MS", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useParticleBurst());

    act(() => { result.current.burst(); });
    expect(result.current.particles).toHaveLength(12);

    act(() => { vi.advanceTimersByTime(PARTICLE_DECAY_MS + 1); });
    expect(result.current.particles).toHaveLength(0);

    vi.useRealTimers();
  });
});
