import { useCallback } from 'react';
import { AudioEngine } from './audioEngine';
import { useOutputMeter } from './useOutputMeter';

export default function OutputSafetyMeter({ engine, active }: { engine: AudioEngine; active: boolean }) {
  const readLevel = useCallback(() => engine.getOutputLevel(), [engine]);
  const { level, state } = useOutputMeter(readLevel, active);
  const bars = 12;
  const filled = Math.round(level * bars);

  return (
    <div className={`output-meter ${state}`} role="status" aria-label={`Output level ${state}`}>
      <div className="output-meter-heading"><span>Output safety</span><strong>{state === 'normal' ? 'Normal' : state === 'caution' ? 'Approaching limit' : 'Reduce level'}</strong></div>
      <div className="output-meter-bars" aria-hidden="true">
        {Array.from({ length: bars }, (_, index) => <span className={index < filled ? 'filled' : ''} key={index} />)}
      </div>
    </div>
  );
}
