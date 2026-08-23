import { useEffect, useState } from 'react';

export type OutputMeterState = 'normal' | 'caution' | 'overload';

export function useOutputMeter(readLevel: () => number, active: boolean) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!active) {
      setLevel(0);
      return;
    }
    let frame = 0;
    const tick = () => {
      setLevel(readLevel());
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [active, readLevel]);

  const state: OutputMeterState = level >= 0.82 ? 'overload' : level >= 0.56 ? 'caution' : 'normal';
  return { level, state };
}
