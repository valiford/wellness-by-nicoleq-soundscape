import { useEffect, useRef, useState } from 'react';

export function useSessionTimer(active: boolean) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (active && !startedRef.current) {
      startedRef.current = true;
      setPaused(false);
    }
    if (!active || paused) return;
    const interval = window.setInterval(() => setElapsedSeconds(current => current + 1), 1000);
    return () => window.clearInterval(interval);
  }, [active, paused]);

  const reset = () => {
    setElapsedSeconds(0);
    setPaused(false);
    startedRef.current = false;
  };

  return { elapsedSeconds, paused, setPaused, reset };
}

export function formatSessionTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}
