import { useEffect, useMemo, useState } from 'react';
import { AudioEngine, ChannelSettings, NoiseKind } from './audioEngine';

type Channel = ChannelSettings & {
  id: string;
  name: string;
  source: NoiseKind | 'tone';
};

type PresentationMode = 'simple' | 'advanced';
type SessionStatus = 'Stopped' | 'Active' | 'Fading' | 'Muted';

const modeStorageKey = 'wbn-soundscape-presentation-mode';

const defaults: Channel[] = [
  { id: 'foundation', name: 'Foundation', source: 'brown', enabled: true, volume: 0.18, frequency: 110, filter: 1800, reverb: 0.08 },
  { id: 'atmosphere', name: 'Atmosphere', source: 'pink', enabled: true, volume: 0.11, frequency: 220, filter: 4200, reverb: 0.18 },
  { id: 'resonance', name: 'Resonance', source: 'tone', enabled: true, volume: 0.05, frequency: 174, filter: 2400, reverb: 0.38 },
  { id: 'light', name: 'Light Tone', source: 'tone', enabled: false, volume: 0.03, frequency: 396, filter: 5000, reverb: 0.52 },
];

const presets: Record<string, Channel[]> = {
  Grounding: defaults,
  Arrival: defaults.map(c => c.id === 'resonance' ? { ...c, frequency: 220, volume: 0.035 } : c.id === 'atmosphere' ? { ...c, volume: 0.15 } : { ...c }),
  Deepening: defaults.map(c => c.id === 'foundation' ? { ...c, volume: 0.24, filter: 1200 } : c.id === 'resonance' ? { ...c, frequency: 136.1, volume: 0.06, reverb: 0.52 } : { ...c }),
  Return: defaults.map(c => c.id === 'light' ? { ...c, enabled: true, frequency: 528, volume: 0.025 } : c.id === 'foundation' ? { ...c, volume: 0.08 } : { ...c }),
};

const getStoredMode = (): PresentationMode => {
  if (typeof window === 'undefined') return 'simple';
  return window.localStorage.getItem(modeStorageKey) === 'advanced' ? 'advanced' : 'simple';
};

export default function App() {
  const engine = useMemo(() => new AudioEngine(), []);
  const [started, setStarted] = useState(false);
  const [channels, setChannels] = useState<Channel[]>(defaults);
  const [master, setMaster] = useState(0.45);
  const [preset, setPreset] = useState('Grounding');
  const [mode, setMode] = useState<PresentationMode>(getStoredMode);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('Stopped');

  useEffect(() => () => engine.stopAll(), [engine]);

  useEffect(() => {
    window.localStorage.setItem(modeStorageKey, mode);
  }, [mode]);

  const start = async () => {
    await engine.start(master);
    channels.forEach(channel => {
      if (channel.source === 'tone') engine.addTone(channel.id, 'sine', channel);
      else engine.addNoise(channel.id, channel.source, channel);
    });
    setStarted(true);
    setSessionStatus(master === 0 ? 'Muted' : 'Active');
  };

  const update = (id: string, patch: Partial<Channel>) => {
    setChannels(current => current.map(channel => {
      if (channel.id !== id) return channel;
      const updated = { ...channel, ...patch };
      if (started) engine.updateChannel(id, updated);
      return updated;
    }));
  };

  const selectPreset = (name: string) => {
    const next = presets[name].map(c => ({ ...c }));
    setPreset(name);
    setChannels(next);
    if (started) next.forEach(c => engine.updateChannel(c.id, c));
  };

  const stop = () => {
    engine.stopAll();
    setStarted(false);
    setSessionStatus('Stopped');
  };

  const setMasterVolume = (value: number) => {
    setMaster(value);
    engine.setMasterVolume(value);
    if (started) setSessionStatus(value === 0 ? 'Muted' : 'Active');
  };

  const fadeMaster = (target: number, seconds: number) => {
    engine.fadeMaster(target, seconds);
    setSessionStatus('Fading');
    window.setTimeout(() => {
      setSessionStatus(target === 0 ? 'Muted' : 'Active');
    }, seconds * 1000);
  };

  const activeChannels = channels.filter(channel => channel.enabled).length;

  return (
    <main>
      <AppHeader />

      <SessionBar
        preset={preset}
        presets={Object.keys(presets)}
        started={started}
        sessionStatus={sessionStatus}
        onPresetChange={selectPreset}
        onStart={start}
        onStop={stop}
        onFadeIn={() => fadeMaster(master, 4)}
        onFadeOut={() => fadeMaster(0, 6)}
        onMute={() => setMasterVolume(0)}
      />

      <MasterControl
        master={master}
        sessionStatus={sessionStatus}
        started={started}
        activeChannels={activeChannels}
        onChange={setMasterVolume}
      />

      <ModeToggle mode={mode} onChange={setMode} />

      <section className="channels" aria-label="Sound channels">
        {channels.map(channel => (
          <ChannelCard
            channel={channel}
            key={channel.id}
            mode={mode}
            isActive={started && channel.enabled && master > 0}
            onChange={patch => update(channel.id, patch)}
          />
        ))}
      </section>

      <footer>
        <p>Designed to support relaxation and guided wellness sessions. Not medical or audiological treatment.</p>
      </footer>
    </main>
  );
}

function AppHeader() {
  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">Wellness by Nicole</p>
        <h1>Soundscape Studio</h1>
        <p className="lede">Private facilitator console for guided sessions, Zoom rooms, and calm in-person transitions.</p>
      </div>
      <span className="session-label">Live-session layout</span>
    </header>
  );
}

function SessionBar({
  preset,
  presets: presetNames,
  started,
  sessionStatus,
  onPresetChange,
  onStart,
  onStop,
  onFadeIn,
  onFadeOut,
  onMute,
}: {
  preset: string;
  presets: string[];
  started: boolean;
  sessionStatus: SessionStatus;
  onPresetChange: (name: string) => void;
  onStart: () => void;
  onStop: () => void;
  onFadeIn: () => void;
  onFadeOut: () => void;
  onMute: () => void;
}) {
  return (
    <section className="session-bar" aria-label="Session controls">
      <label className="preset-control">
        <span>Session preset</span>
        <select value={preset} onChange={e => onPresetChange(e.target.value)}>
          {presetNames.map(name => <option key={name}>{name}</option>)}
        </select>
      </label>

      {!started
        ? <button className="primary action-main" onClick={onStart}>Start audio</button>
        : <button className="stop action-main" onClick={onStop}>Stop audio</button>}

      <button onClick={onFadeIn} disabled={!started}>Fade in</button>
      <button onClick={onFadeOut} disabled={!started}>Fade out</button>
      <button className="danger" onClick={onMute} disabled={!started}>Mute all</button>

      <div className={`live-status ${sessionStatus.toLowerCase()}`} aria-live="polite">
        <span aria-hidden="true" />
        {sessionStatus}
      </div>
    </section>
  );
}

function MasterControl({
  master,
  sessionStatus,
  started,
  activeChannels,
  onChange,
}: {
  master: number;
  sessionStatus: SessionStatus;
  started: boolean;
  activeChannels: number;
  onChange: (value: number) => void;
}) {
  const outputStatus = !started ? 'Output stopped' : master === 0 ? 'Output muted' : `${activeChannels} channel${activeChannels === 1 ? '' : 's'} enabled`;

  return (
    <section className="master" aria-label="Master output">
      <div className="master-copy">
        <p className="eyebrow">Master output</p>
        <h2>Room level</h2>
        <p>{outputStatus} · {sessionStatus === 'Fading' ? 'Fade in progress' : 'Ready for gentle adjustments'}</p>
      </div>

      <label className="master-slider">
        <span>Master volume</span>
        <strong>{Math.round(master * 100)}%</strong>
        <input type="range" min="0" max="0.8" step="0.01" value={master} onChange={e => onChange(Number(e.target.value))} />
      </label>

      <p className="status">Use headphones or a tested Zoom audio route before starting. Keep levels comfortable and increase gradually.</p>
    </section>
  );
}

function ModeToggle({ mode, onChange }: { mode: PresentationMode; onChange: (mode: PresentationMode) => void }) {
  return (
    <section className="mode-row" aria-label="Presentation mode">
      <div>
        <p className="eyebrow">Operating view</p>
        <h2>Channel controls</h2>
      </div>
      <div className="segmented" role="group" aria-label="Choose channel detail level">
        <button className={mode === 'simple' ? 'selected' : ''} onClick={() => onChange('simple')} aria-pressed={mode === 'simple'}>Simple</button>
        <button className={mode === 'advanced' ? 'selected' : ''} onClick={() => onChange('advanced')} aria-pressed={mode === 'advanced'}>Advanced</button>
      </div>
    </section>
  );
}

function ChannelCard({
  channel,
  mode,
  isActive,
  onChange,
}: {
  channel: Channel;
  mode: PresentationMode;
  isActive: boolean;
  onChange: (patch: Partial<Channel>) => void;
}) {
  const channelState = isActive ? 'active' : channel.enabled ? 'armed' : 'muted';

  return (
    <article className={`channel ${channelState}`}>
      <div className="channel-heading">
        <div>
          <p className="source">{channel.source === 'tone' ? 'Generated tone' : `${channel.source} noise source`}</p>
          <h2>{channel.name}</h2>
        </div>
        <label className="switch">
          <input type="checkbox" checked={channel.enabled} onChange={e => onChange({ enabled: e.target.checked })} />
          <span>{channel.enabled ? 'On' : 'Off'}</span>
        </label>
      </div>

      <Control label="Volume" value={channel.volume} min={0} max={0.35} step={0.005} display={`${Math.round(channel.volume * 100)}%`} onChange={value => onChange({ volume: value })} />

      {mode === 'advanced' && (
        <details className="advanced-controls" open>
          <summary>Tone shaping</summary>
          {channel.source === 'tone' && <Control label="Tone frequency" value={channel.frequency} min={40} max={800} step={1} display={`${Math.round(channel.frequency)} Hz`} onChange={value => onChange({ frequency: value })} />}
          <Control label="Warmth / filter" value={channel.filter} min={250} max={10000} step={50} display={`${Math.round(channel.filter)} Hz`} onChange={value => onChange({ filter: value })} />
          <Control label="Reverb" value={channel.reverb} min={0} max={0.8} step={0.01} display={`${Math.round(channel.reverb * 100)}%`} onChange={value => onChange({ reverb: value })} />
        </details>
      )}
    </article>
  );
}

function Control({ label, value, min, max, step, display, onChange }: { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (value: number) => void }) {
  return (
    <label className="control">
      <span>{label}</span>
      <strong>{display}</strong>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    </label>
  );
}
