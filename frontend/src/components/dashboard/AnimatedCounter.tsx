'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatFn?: (value: number) => string;
}

export function AnimatedCounter({ value, duration = 600, formatFn }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const rafRef = useRef<number>();

  useEffect(() => {
    const from = previousValue.current;
    const to = value;
    previousValue.current = value;

    if (from === to) return;

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(to);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration]);

  const formatted = formatFn ? formatFn(displayValue) : Math.round(displayValue).toLocaleString();

  return <span>{formatted}</span>;
}
