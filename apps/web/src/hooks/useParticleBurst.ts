"use client";

import { useState, useCallback } from "react";
import { PARTICLE_COLORS, PARTICLE_DECAY_MS } from "@/constants/config";
import type { Particle } from "@/types";

/**
 * Generates a burst of coloured particles for the send-confirmation animation.
 * Particles clear themselves after PARTICLE_DECAY_MS.
 */
export function useParticleBurst() {
  const [particles, setParticles] = useState<Particle[]>([]);

  const burst = useCallback(() => {
    const newParticles: Particle[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 200 - 100,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), PARTICLE_DECAY_MS);
  }, []);

  return { particles, burst };
}
