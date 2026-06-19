"use client";

import { useState, useEffect, useCallback } from "react";

interface CountdownResult {
  days:    number;
  hours:   number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

/**
 * Live countdown to a Unix timestamp (in seconds).
 * Ticks every second. Returns `expired: true` once past deadline.
 */
export function useCountdown(targetUnixSec: bigint | number | undefined): CountdownResult {
  const target = targetUnixSec !== undefined ? Number(targetUnixSec) * 1000 : null;

  const calc = useCallback((): CountdownResult => {
    if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    const diff = target - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    const totalSec = Math.floor(diff / 1000);
    return {
      days:    Math.floor(totalSec / 86400),
      hours:   Math.floor((totalSec % 86400) / 3600),
      minutes: Math.floor((totalSec % 3600) / 60),
      seconds: totalSec % 60,
      expired: false,
    };
  }, [target]);

  const [result, setResult] = useState<CountdownResult>(calc);

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setResult(calc()), 1000);
    return () => clearInterval(id);
  }, [target, calc]);

  return result;
}
