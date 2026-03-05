import { useEffect, useRef, useState } from 'react';
import { formatDownloads } from '../lib/dataUtils';

interface Props {
  target: number;
  duration?: number;
}

export function AnimatedCounter({ target, duration = 1800 }: Props) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const startValueRef = useRef(0);

  useEffect(() => {
    if (target === 0) return;
    startValueRef.current = current;
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(startValueRef.current + (target - startValueRef.current) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return (
    <span className="tabular-nums">{formatDownloads(current)}</span>
  );
}
