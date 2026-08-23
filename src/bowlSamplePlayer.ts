export type BowlId = 'root' | 'heart' | 'crown';
export type BowlStyleId = 'regular-strike' | 'amplified-rim' | 'hard-strike';

export type BowlDefinition = {
  id: BowlId;
  name: string;
  association: string;
};

export type BowlStyle = {
  id: BowlStyleId;
  name: string;
  defaultVolume: number;
};

export type BowlSample = {
  id: string;
  bowlId: BowlId;
  styleId: BowlStyleId;
  label: string;
  url: string;
  defaultVolume: number;
};

export type BowlLoadState = 'unloaded' | 'loading' | 'ready' | 'failed';

export type SamplePlaybackSnapshot = {
  id: string;
  sampleId: string;
  label: string;
  volume: number;
  muted: boolean;
  fading: boolean;
};

type SampleDestination = {
  context: AudioContext;
  master: GainNode;
  convolver: ConvolverNode;
};

type PlaybackNodes = SamplePlaybackSnapshot & {
  source: AudioBufferSourceNode;
  gain: GainNode;
  dry: GainNode;
  wet: GainNode;
};

export const bowlDefinitions: BowlDefinition[] = [
  { id: 'root', name: 'Root Bowl', association: 'Traditional association: 396 Hz' },
  { id: 'heart', name: 'Heart Bowl', association: 'Traditional association: 639 Hz' },
  { id: 'crown', name: 'Crown Bowl', association: 'Traditional association: 963 Hz' },
];

export const bowlStyles: BowlStyle[] = [
  { id: 'regular-strike', name: 'Regular Strike', defaultVolume: 0.65 },
  { id: 'amplified-rim', name: 'Amplified Rim', defaultVolume: 0.6 },
  { id: 'hard-strike', name: 'Hard Strike', defaultVolume: 0.45 },
];

export const bowlSamples: BowlSample[] = bowlDefinitions.flatMap(bowl => bowlStyles.map(style => ({
  id: `${bowl.id}-${style.id}`,
  bowlId: bowl.id,
  styleId: style.id,
  label: `${bowl.name} - ${style.name}`,
  url: `/audio/bowls/${bowl.id}-${style.id}.wav`,
  defaultVolume: style.defaultVolume,
})));

export class BowlSamplePlayer {
  private buffers = new Map<string, AudioBuffer>();
  private loadStates = new Map<string, BowlLoadState>();
  private loadPromises = new Map<string, Promise<void>>();
  private loadListeners = new Set<(sampleId: string, state: BowlLoadState) => void>();
  private playbacks = new Map<string, PlaybackNodes>();
  private nextPlaybackId = 1;

  constructor(private readonly getDestination: () => Promise<SampleDestination | null>) {}

  subscribeToLoadState(listener: (sampleId: string, state: BowlLoadState) => void) {
    this.loadListeners.add(listener);
    return () => this.loadListeners.delete(listener);
  }

  getLoadState(sampleId: string): BowlLoadState {
    return this.loadStates.get(sampleId) ?? 'unloaded';
  }

  async preloadPriority() {
    await Promise.all(bowlSamples.filter(sample => sample.styleId === 'regular-strike').map(sample => this.load(sample)));
  }

  async preloadOptional() {
    for (const sample of bowlSamples.filter(item => item.styleId !== 'regular-strike')) {
      try { await this.load(sample); } catch { /* optional styles report their own failed state */ }
    }
  }

  async load(sample: BowlSample) {
    if (this.buffers.has(sample.id)) return;
    const existing = this.loadPromises.get(sample.id);
    if (existing) return existing;
    this.setLoadState(sample.id, 'loading');
    const promise = (async () => {
      const destination = await this.getDestination();
      try {
        if (!destination) throw new Error('Audio output is not ready.');
        const response = await fetch(sample.url);
        if (!response.ok) throw new Error('The bowl audio file could not be loaded.');
        const data = await response.arrayBuffer();
        const buffer = await destination.context.decodeAudioData(data);
        this.buffers.set(sample.id, buffer);
        this.setLoadState(sample.id, 'ready');
      } catch (error) {
        this.setLoadState(sample.id, 'failed');
        throw error;
      } finally {
        this.loadPromises.delete(sample.id);
      }
    })();
    this.loadPromises.set(sample.id, promise);
    return promise;
  }

  async play(sample: BowlSample, onEnded: (id: string) => void, volume = sample.defaultVolume) {
    await this.load(sample);
    const destination = await this.getDestination();
    const buffer = this.buffers.get(sample.id);
    if (!destination || !buffer) throw new Error('Audio output is not ready.');

    const { context, master, convolver } = destination;
    const id = `bowl-${this.nextPlaybackId++}`;
    const source = context.createBufferSource();
    const gain = context.createGain();
    const dry = context.createGain();
    const wet = context.createGain();
    const now = context.currentTime;

    source.buffer = buffer;
    source.loop = false;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    dry.gain.value = 0.54;
    wet.gain.value = 0.46;

    source.connect(gain);
    gain.connect(dry);
    gain.connect(wet);
    dry.connect(master);
    wet.connect(convolver);

    const playback: PlaybackNodes = {
      id,
      sampleId: sample.id,
      label: sample.label,
      volume,
      muted: false,
      fading: false,
      source,
      gain,
      dry,
      wet,
    };
    this.playbacks.set(id, playback);

    source.onended = () => {
      this.cleanup(id);
      onEnded(id);
    };
    source.start(now);

    return this.snapshot(id);
  }

  setVolume(id: string, volume: number) {
    const playback = this.playbacks.get(id);
    if (!playback) return null;
    playback.volume = volume;
    playback.fading = false;
    this.applyGain(playback);
    return this.snapshot(id);
  }

  setMuted(id: string, muted: boolean) {
    const playback = this.playbacks.get(id);
    if (!playback) return null;
    playback.muted = muted;
    playback.fading = false;
    this.applyGain(playback);
    return this.snapshot(id);
  }

  stop(id: string) {
    const playback = this.playbacks.get(id);
    if (!playback) return;
    try { playback.source.stop(); } catch { this.cleanup(id); }
  }

  fadeOut(id: string, seconds = 4) {
    const playback = this.playbacks.get(id);
    if (!playback) return null;
    const context = playback.gain.context;
    const now = context.currentTime;
    playback.fading = true;
    playback.gain.gain.cancelScheduledValues(now);
    playback.gain.gain.setValueAtTime(playback.gain.gain.value, now);
    playback.gain.gain.linearRampToValueAtTime(0, now + seconds);
    window.setTimeout(() => this.stop(id), seconds * 1000);
    return this.snapshot(id);
  }

  muteAll() {
    const snapshots: SamplePlaybackSnapshot[] = [];
    this.playbacks.forEach(playback => {
      playback.muted = true;
      playback.fading = false;
      playback.gain.gain.cancelScheduledValues(playback.gain.context.currentTime);
      playback.gain.gain.value = 0;
      const snapshot = this.snapshot(playback.id);
      if (snapshot) snapshots.push(snapshot);
    });
    return snapshots;
  }

  stopAll() {
    Array.from(this.playbacks.keys()).forEach(id => this.stop(id));
    this.playbacks.clear();
  }

  private applyGain(playback: PlaybackNodes) {
    const now = playback.gain.context.currentTime;
    playback.gain.gain.cancelScheduledValues(now);
    playback.gain.gain.setTargetAtTime(playback.muted ? 0 : playback.volume, now, 0.02);
  }

  private setLoadState(sampleId: string, state: BowlLoadState) {
    this.loadStates.set(sampleId, state);
    this.loadListeners.forEach(listener => listener(sampleId, state));
  }

  private snapshot(id: string) {
    const playback = this.playbacks.get(id);
    if (!playback) return null;
    const { source, gain, dry, wet, ...snapshot } = playback;
    return snapshot;
  }

  private cleanup(id: string) {
    const playback = this.playbacks.get(id);
    if (!playback) return;
    this.playbacks.delete(id);
    playback.source.disconnect();
    playback.gain.disconnect();
    playback.dry.disconnect();
    playback.wet.disconnect();
  }
}
