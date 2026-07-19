import { useEffect, useMemo, useState } from 'react';
import { AudioEngine, ChannelSettings, NoiseKind } from './audioEngine';

type Channel = ChannelSettings & {
  id: string;
  name: string;
  source: NoiseKind | 'tone';
};

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

export default function App() {
  const engine = useMemo(() => new AudioEngine(), []);
  const [started, setStarted] = useState(false);
  const [channels, setChannels] = useState<Channel[]>(defaults);
  const [master, setMaster] = useState(0.45);
  const [preset, setPreset] = useState('Grounding');

  useEffect(() => () => engine.stopAll(), [engine]);

  const start = async () => {
    await engine.start(master);
    channels.forEach(channel => {
      if (channel.source === 'tone') engine.addTone(channel.id, 'sine', channel);
      else engine.addNoise(channel.id, channel.source, channel);
    });
    setStarted(true);
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
  };

  return (
    <main>
      <header>
        <p className="eyebrow">Wellness by Nicole</p>
        <h1>Soundscape Studio</h1>
        <p className="lede">A live sound console for guided wellness sessions.</p>
      </header>

      <section className="toolbar" aria-label="Session controls">
        <label>
          Session preset
          <select value={preset} onChange={e => selectPreset(e.target.value)}>
            {Object.keys(presets).map(name => <option key={name}>{name}</option>)}
          </select>
        </label>
        {!started ? <button className="primary" onClick={start}>Start audio</button> : <button onClick={stop}>Stop audio</button>}
        <button onClick={() => engine.fadeMaster(master, 4)} disabled={!started}>Fade in</button>
        <button onClick={() => engine.fadeMaster(0, 6)} disabled={!started}>Fade out</button>
        <button className="danger" onClick={() => { engine.setMasterVolume(0); setMaster(0); }} disabled={!started}>Mute all</button>
      </section>

      <section className="master">
        <label>
          <span>Master volume</span>
          <strong>{Math.round(master * 100)}%</strong>
          <input type="range" min="0" max="0.8" step="0.01" value={master} onChange={e => { const value = Number(e.target.value); setMaster(value); engine.setMasterVolume(value); }} />
        </label>
        <p className="status">{started ? 'Audio active' : 'Audio stopped'} · Use headphones during Zoom sessions.</p>
      </section>

      <section className="channels">
        {channels.map(channel => (
          <article className="channel" key={channel.id}>
            <div className="channel-heading">
              <div>
                <p className="source">{channel.source === 'tone' ? 'Generated tone' : `${channel.source} noise`}</p>
                <h2>{channel.name}</h2>
              </div>
              <label className="switch">
                <input type="checkbox" checked={channel.enabled} onChange={e => update(channel.id, { enabled: e.target.checked })} />
                <span>{channel.enabled ? 'On' : 'Off'}</span>
              </label>
            </div>

            <Control label="Volume" value={channel.volume} min={0} max={0.35} step={0.005} display={`${Math.round(channel.volume * 100)}%`} onChange={value => update(channel.id, { volume: value })} />
            {channel.source === 'tone' && <Control label="Frequency" value={channel.frequency} min={40} max={800} step={1} display={`${Math.round(channel.frequency)} Hz`} onChange={value => update(channel.id, { frequency: value })} />}
            <Control label="Warmth / filter" value={channel.filter} min={250} max={10000} step={50} display={`${Math.round(channel.filter)} Hz`} onChange={value => update(channel.id, { filter: value })} />
            <Control label="Reverb" value={channel.reverb} min={0} max={0.8} step={0.01} display={`${Math.round(channel.reverb * 100)}%`} onChange={value => update(channel.id, { reverb: value })} />
          </article>
        ))}
      </section>

      <footer>
        <p>Designed to support relaxation and guided wellness sessions. Not medical or audiological treatment.</p>
      </footer>
    </main>
  );
}

function Control({ label, value, min, max, step, display, onChange }: { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (value: number) => void }) {
  return <label className="control"><span>{label}</span><strong>{display}</strong><input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} /></label>;
}
