import { AudioEngine } from './audioEngine';
import OutputSafetyMeter from './OutputSafetyMeter';
import { formatSessionTime } from './useSessionTimer';

type LiveEssentialsProps = {
  engine: AudioEngine;
  started: boolean;
  bowlReady: boolean;
  master: number;
  elapsedSeconds: number;
  timerPaused: boolean;
  onTimerPause: (paused: boolean) => void;
  onTimerReset: () => void;
  onMasterChange: (value: number) => void;
  onFade: (seconds: number) => void;
  voiceDucked: boolean;
  onDuck: () => void;
  onBowl: (sampleId: string) => void;
};

export default function LiveEssentials({ engine, started, bowlReady, master, elapsedSeconds, timerPaused, onTimerPause, onTimerReset, onMasterChange, onFade, voiceDucked, onDuck, onBowl }: LiveEssentialsProps) {
  return (
    <section className="live-essentials" aria-label="Live essentials">
      <div className="live-essential-timer">
        <span className="eyebrow">Session</span>
        <strong>{formatSessionTime(elapsedSeconds)}</strong>
        <div className="live-essential-actions">
          <button onClick={() => onTimerPause(!timerPaused)} disabled={!started}>{timerPaused ? 'Resume timer' : 'Pause timer'}</button>
          <button onClick={onTimerReset}>Reset timer</button>
        </div>
      </div>
      <label className="live-essential-master">
        <span>Master volume</span><strong>{Math.round(master * 100)}%</strong>
        <input type="range" min="0" max="0.8" step="0.01" value={master} onChange={event => onMasterChange(Number(event.target.value))} />
      </label>
      <div className="live-essential-actions live-essential-buttons">
        {[30, 60, 120].map(seconds => <button key={seconds} onClick={() => onFade(seconds)} disabled={!started}>Fade {seconds}</button>)}
        <button aria-pressed={voiceDucked} onClick={onDuck} disabled={!started}>{voiceDucked ? 'Restore voice mix' : 'Duck for voice'}</button>
      </div>
      <div className="live-essential-bowls" aria-label="Quick bowl triggers">
        <span className="eyebrow">Quick bowls</span>
        {(['root', 'heart', 'crown'] as const).map(id => <button key={id} onClick={() => onBowl(`${id}-regular-strike`)} disabled={!started || !bowlReady}>{id}</button>)}
      </div>
      <OutputSafetyMeter engine={engine} active={started} />
    </section>
  );
}
