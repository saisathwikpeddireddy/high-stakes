"use client";

import { useEffect, useRef, useState } from "react";

// Smoothly animate a number toward `value` (eased) for premium counters.
export function useCountUp(value, duration = 800) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = null;
    const from = fromRef.current;
    const delta = value - from;
    if (delta === 0) return;

    const step = (t) => {
      if (startRef.current === null) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(Math.round(from + delta * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return display;
}
