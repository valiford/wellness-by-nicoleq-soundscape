import { useEffect, useMemo, useRef, useState } from 'react';
import { AudioEngine, ChannelSettings, NoiseKind } from './audioEngine';
import { BowlSamplePlayer, SamplePlaybackSnapshot, bowlDefinitions, bowlSamples, bowlStyles } from './bowlSamplePlayer';

type Channel = ChannelSettings & {
  id: string;
  name: string;
  source: NoiseKind | 'tone';
};

type PresentationMode = 'simple' | 'advanced';
type SessionStatus = 'Stopped' | 'Active' | 'Fading' | 'Muted';
type SampleStatus = 'Idle' | 'Loading' | 'Ready' | 'Error';

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
  const bowlPlayer = useMemo(() => new BowlSamplePlayer(() => engine.getSampleDestination(master)), [engine]);
  const fadeTimeoutRef = useRef<number | null>(null);
  const lastNonZeroMasterRef = useRef(0.45);
  const [started, setStarted] = useState(false);
  const [channels, setChannels] = useState<Channel[]>(defaults);
  const [master, setMaster] = useState(0.45);
  const [preset, setPreset] = useState('Grounding');
  const [mode, setMode] = useState<PresentationMode>(getStoredMode);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('Stopped');
  const [sampleStatus, setSampleStatus] = useState<SampleStatus>('Idle');
  const [sampleError, setSampleError] = useState('');
  const [activeSamples, setActiveSamples] = useState<SamplePlaybackSnapshot[]>([]);

  const cancelFadeTimeout = () => {
    if (fadeTimeoutRef.current === null) return;
    window.clearTimeout(fadeTimeoutRef.current);
    fadeTimeoutRef.current = null;
  };

  useEffect(() => () => {
    cancelFadeTimeout();
    engine.stopAll();
    bowlPlayer.stopAll();
  }, [bowlPlayer, engine]);

  useEffect(() => {
    window.localStorage.setItem(modeStorageKey, mode);
  }, [mode]);

  useEffect(() => {
    if (!started) {
      setSampleStatus('Idle');
      return;
    }

    let cancelled = false;
    setSampleStatus('Loading');
    setSampleError('');
    bowlPlayer.preload()
      .then(() => {
        if (!cancelled) setSampleStatus('Ready');
      })
      .catch(() => {
        if (!cancelled) {
          setSampleStatus('Error');
          setSampleError('One or more bowl files could not load. Please check the audio folder before using bowls in-session.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bowlPlayer, started]);

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
    cancelFadeTimeout();
    engine.stopAll();
    bowlPlayer.stopAll();
    setActiveSamples([]);
    setStarted(false);
    setSessionStatus('Stopped');
  };

  const setMasterVolume = (value: number) => {
    cancelFadeTimeout();
    setMaster(value);
    if (value > 0) lastNonZeroMasterRef.current = value;
    engine.setMasterVolume(value);
    if (started) setSessionStatus(value === 0 ? 'Muted' : 'Active');
  };

  const muteAll = () => {
    cancelFadeTimeout();
    setMaster(0);
    engine.setMasterVolume(0);
    if (started) setSessionStatus('Muted');
  };

  const fadeMaster = (target: number, seconds: number, completedStatus: SessionStatus) => {
    cancelFadeTimeout();
    engine.fadeMaster(target, seconds);
    setSessionStatus('Fading');
    fadeTimeoutRef.current = window.setTimeout(() => {
      fadeTimeoutRef.current = null;
      setMaster(target);
      if (target > 0) lastNonZeroMasterRef.current = target;
      engine.setMasterVolume(target);
      setSessionStatus(completedStatus);
    }, seconds * 1000);
  };

  const fadeOut = () => {
    fadeMaster(0, 6, 'Muted');
  };

  const fadeIn = () => {
    const target = lastNonZeroMasterRef.current || 0.45;
    fadeMaster(target, 4, 'Active');
  };

  const removeActiveSample = (id: string) => {
    setActiveSamples(current => current.filter(sample => sample.id !== id));
  };

  const replaceActiveSample = (snapshot: SamplePlaybackSnapshot | null) => {
    if (!snapshot) return;
    setActiveSamples(current => current.map(sample => sample.id === snapshot.id ? snapshot : sample));
  };

  const playBowl = async (sampleId: string) => {
    const sample = bowlSamples.find(item => item.id === sampleId);
    if (!sample || !started) return;
    try {
      const playback = await bowlPlayer.play(sample, removeActiveSample);
      if (playback) setActiveSamples(current => [playback, ...current]);
      setSampleStatus('Ready');
      setSampleError('');
    } catch {
      setSampleStatus('Error');
      setSampleError('That bowl file could not load. Please check the audio folder before using this sample in-session.');
    }
  };

  const updateBowlVolume = (id: string, volume: number) => {
    replaceActiveSample(bowlPlayer.setVolume(id, volume));
  };

  const toggleBowlMute = (id: string, muted: boolean) => {
    replaceActiveSample(bowlPlayer.setMuted(id, muted));
  };

  const stopBowl = (id: string) => {
    bowlPlayer.stop(id);
    removeActiveSample(id);
  };

  const fadeBowl = (id: string) => {
    replaceActiveSample(bowlPlayer.fadeOut(id));
  };

  const stopAllBowls = () => {
    bowlPlayer.stopAll();
    setActiveSamples([]);
  };

  const fadeAllBowls = () => {
    activeSamples.forEach(sample => replaceActiveSample(bowlPlayer.fadeOut(sample.id)));
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
        onFadeIn={fadeIn}
        onFadeOut={fadeOut}
        onMute={muteAll}
      />

      <MasterControl
        master={master}
        sessionStatus={sessionStatus}
        started={started}
        activeChannels={activeChannels}
        onChange={setMasterVolume}
      />

      <BowlPlayer
        activeSamples={activeSamples}
        sampleStatus={sampleStatus}
        sampleError={sampleError}
        started={started}
        onPlay={playBowl}
        onVolumeChange={updateBowlVolume}
        onMuteChange={toggleBowlMute}
        onStop={stopBowl}
        onFadeOut={fadeBowl}
        onStopAll={stopAllBowls}
        onFadeAll={fadeAllBowls}
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

function BowlPlayer({
  activeSamples,
  sampleStatus,
  sampleError,
  started,
  onPlay,
  onVolumeChange,
  onMuteChange,
  onStop,
  onFadeOut,
  onStopAll,
  onFadeAll,
}: {
  activeSamples: SamplePlaybackSnapshot[];
  sampleStatus: SampleStatus;
  sampleError: string;
  started: boolean;
  onPlay: (sampleId: string) => void;
  onVolumeChange: (id: string, value: number) => void;
  onMuteChange: (id: string, muted: boolean) => void;
  onStop: (id: string) => void;
  onFadeOut: (id: string) => void;
  onStopAll: () => void;
  onFadeAll: () => void;
}) {
  const statusCopy = !started
    ? 'Start audio to arm bowls'
    : sampleStatus === 'Loading'
      ? 'Loading bowl samples'
      : sampleStatus === 'Error'
        ? 'Bowl sample needs attention'
        : activeSamples.length > 0
          ? `${activeSamples.length} active bowl sample${activeSamples.length === 1 ? '' : 's'}`
          : 'Bowls ready';

  return (
    <section className="bowl-player" aria-label="Bowls">
      <div className="bowl-heading">
        <div>
          <p className="eyebrow">Sample player</p>
          <h2>Bowls</h2>
          <p>{statusCopy}</p>
          <p className="bowl-note">Hz values are traditional associations used for organization, not measured acoustic frequencies.</p>
        </div>
        <div className={`sample-status ${sampleStatus.toLowerCase()}`} aria-live="polite">
          <span aria-hidden="true" />
          {sampleStatus}
        </div>
      </div>

      {sampleError && <p className="sample-error" role="alert">{sampleError}</p>}

      <div className="bowl-grid">
        {bowlDefinitions.map(bowl => (
          <article className="bowl-card" key={bowl.id}>
            <div>
              <h3>{bowl.name}</h3>
              <p>{bowl.association}</p>
            </div>
            <div className="strike-row" aria-label={`${bowl.name} strikes`}>
              {bowlStyles.map(style => {
                const sample = bowlSamples.find(item => item.bowlId === bowl.id && item.styleId === style.id);
                if (!sample) return null;
                return (
                  <button
                    className="strike-button"
                    disabled={!started}
                    key={sample.id}
                    onClick={() => onPlay(sample.id)}
                    aria-label={`Play ${sample.label}`}
                  >
                    Play {style.name}
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      <div className="active-samples" aria-live="polite">
        <div className="active-samples-heading">
          <h3>Active bowls</h3>
          <div>
            <button disabled={activeSamples.length === 0} onClick={onFadeAll}>Fade out bowls</button>
            <button className="stop" disabled={activeSamples.length === 0} onClick={onStopAll}>Stop bowls</button>
          </div>
        </div>
        {activeSamples.length === 0 ? (
          <p className="empty-active">No bowl samples playing.</p>
        ) : (
          <div className="active-sample-list">
            {activeSamples.map(sample => (
              <article className={`active-sample ${sample.muted ? 'sample-muted' : ''} ${sample.fading ? 'sample-fading' : ''}`} key={sample.id}>
                <div className="active-sample-title">
                  <strong>{sample.label}</strong>
                  <span>{sample.fading ? 'Fading out' : sample.muted ? 'Muted' : 'Playing'}</span>
                </div>
                <Control label="Volume" value={sample.volume} min={0} max={0.55} step={0.01} display={`${Math.round(sample.volume * 100)}%`} onChange={value => onVolumeChange(sample.id, value)} />
                <div className="active-sample-actions">
                  <button aria-pressed={sample.muted} onClick={() => onMuteChange(sample.id, !sample.muted)}>{sample.muted ? 'Unmute' : 'Mute'}</button>
                  <button onClick={() => onFadeOut(sample.id)} disabled={sample.fading}>Fade out</button>
                  <button className="stop" onClick={() => onStop(sample.id)}>Stop</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function AppHeader() {
  return (
    <header className="app-header">
      <div className="brand-heading">
        <p className="eyebrow">Wellness by Nicole Q</p>
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
