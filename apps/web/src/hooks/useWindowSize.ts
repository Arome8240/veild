"use client";

import { useState, useEffect } from "react";

interface Size { width: number; height: number }

/** Reactive window size — returns { width: 0, height: 0 } on server. */
export function useWindowSize(): Size {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return size;
}
