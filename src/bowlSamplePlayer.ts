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
  { id: 'regular-strike', name: 'Regular Strike', defaultVolume: 0.24 },
  { id: 'amplified-rim', name: 'Amplified Rim', defaultVolume: 0.2 },
  { id: 'hard-strike', name: 'Hard Strike', defaultVolume: 0.15 },
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
  private playbacks = new Map<string, PlaybackNodes>();
  private nextPlaybackId = 1;

  constructor(private readonly getDestination: () => Promise<SampleDestination | null>) {}

  async preload(samples = bowlSamples) {
    await Promise.all(samples.map(sample => this.load(sample)));
  }

  async load(sample: BowlSample) {
    if (this.buffers.has(sample.id)) return;
    const destination = await this.getDestination();
    if (!destination) throw new Error('Audio output is not ready.');

    const response = await fetch(sample.url);
    if (!response.ok) throw new Error('The bowl audio file could not be loaded.');

    const data = await response.arrayBuffer();
    const buffer = await destination.context.decodeAudioData(data);
    this.buffers.set(sample.id, buffer);
  }

  async play(sample: BowlSample, onEnded: (id: string) => void) {
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
    gain.gain.linearRampToValueAtTime(sample.defaultVolume, now + 0.02);
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
      volume: sample.defaultVolume,
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

  stopAll() {
    Array.from(this.playbacks.keys()).forEach(id => this.stop(id));
    this.playbacks.clear();
  }

  private applyGain(playback: PlaybackNodes) {
    const now = playback.gain.context.currentTime;
    playback.gain.gain.cancelScheduledValues(now);
    playback.gain.gain.setTargetAtTime(playback.muted ? 0 : playback.volume, now, 0.02);
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
