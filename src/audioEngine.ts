export type NoiseKind = 'white' | 'pink' | 'brown';

export type ChannelSettings = {
  enabled: boolean;
  volume: number;
  frequency: number;
  filter: number;
  reverb: number;
};

type ChannelNodes = {
  source: AudioScheduledSourceNode;
  gain: GainNode;
  filter: BiquadFilterNode;
  dry: GainNode;
  wet: GainNode;
  settings: ChannelSettings;
};

export class AudioEngine {
  private context: AudioContext | null = null;
  private startPromise: Promise<void> | null = null;
  private master: GainNode | null = null;
  private safety: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private convolver: ConvolverNode | null = null;
  private channels = new Map<string, ChannelNodes>();
  private voiceDucked = false;

  async start(masterVolume = 0.45) {
    if (this.context) {
      if (this.context.state === 'suspended') await this.context.resume();
      return;
    }
    if (this.startPromise) return this.startPromise;
    this.startPromise = (async () => {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = masterVolume;
      this.safety = this.context.createDynamicsCompressor();
      this.safety.threshold.value = -6;
      this.safety.knee.value = 12;
      this.safety.ratio.value = 4;
      this.safety.attack.value = 0.003;
      this.safety.release.value = 0.25;
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;
      this.master.connect(this.safety);
      this.safety.connect(this.analyser);
      this.analyser.connect(this.context.destination);
      this.convolver = this.context.createConvolver();
      this.convolver.buffer = this.createImpulseResponse(2.2, 2.4);
      this.convolver.connect(this.master);
      if (this.context.state === 'suspended') await this.context.resume();
    })();
    try {
      await this.startPromise;
    } finally {
      this.startPromise = null;
    }
  }

  stopAll() {
    this.channels.forEach(({ source, gain, filter, dry, wet }) => {
      try { source.stop(); } catch { /* already stopped */ }
      source.disconnect();
      gain.disconnect();
      filter.disconnect();
      dry.disconnect();
      wet.disconnect();
    });
    this.channels.clear();
  }

  setMasterVolume(value: number) {
    if (!this.master || !this.context) return;
    this.master.gain.setTargetAtTime(value, this.context.currentTime, 0.03);
  }

  async fadeMaster(target: number, seconds: number) {
    if (!this.master || !this.context) return;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(target, now + seconds);
  }

  addNoise(id: string, kind: NoiseKind, settings: ChannelSettings) {
    if (!this.context || !this.master || !this.convolver) return;
    this.removeChannel(id);
    const source = this.context.createBufferSource();
    source.buffer = this.createNoiseBuffer(kind);
    source.loop = true;
    this.connectChannel(id, source, settings);
    source.start();
  }

  addTone(id: string, waveform: OscillatorType, settings: ChannelSettings) {
    if (!this.context || !this.master || !this.convolver) return;
    this.removeChannel(id);
    const source = this.context.createOscillator();
    source.type = waveform;
    source.frequency.value = settings.frequency;
    this.connectChannel(id, source, settings);
    source.start();
  }

  async getSampleDestination(masterVolume = 0.45) {
    await this.start(masterVolume);
    if (!this.context || !this.master || !this.convolver) return null;
    return { context: this.context, master: this.master, convolver: this.convolver };
  }

  getAnalyser() {
    return this.analyser;
  }

  getOutputLevel() {
    if (!this.analyser) return 0;
    const data = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(data);
    let total = 0;
    data.forEach(value => {
      const sample = (value - 128) / 128;
      total += sample * sample;
    });
    return Math.min(1, Math.sqrt(total / data.length) * 2.8);
  }

  updateChannel(id: string, settings: ChannelSettings) {
    const node = this.channels.get(id);
    if (!node || !this.context) return;
    const now = this.context.currentTime;
    node.settings = { ...settings };
    node.gain.gain.setTargetAtTime(this.effectiveChannelVolume(settings), now, 0.03);
    node.filter.frequency.setTargetAtTime(settings.filter, now, 0.03);
    node.dry.gain.setTargetAtTime(1 - settings.reverb, now, 0.03);
    node.wet.gain.setTargetAtTime(settings.reverb, now, 0.03);
    if (node.source instanceof OscillatorNode) {
      node.source.frequency.setTargetAtTime(settings.frequency, now, 0.03);
    }
  }

  removeChannel(id: string) {
    const existing = this.channels.get(id);
    if (!existing) return;
    try { existing.source.stop(); } catch { /* already stopped */ }
    existing.source.disconnect();
    existing.gain.disconnect();
    existing.filter.disconnect();
    existing.dry.disconnect();
    existing.wet.disconnect();
    this.channels.delete(id);
  }

  setVoiceDuck(ducked: boolean) {
    this.voiceDucked = ducked;
    if (!this.context) return;
    const now = this.context.currentTime;
    this.channels.forEach(({ gain, settings }) => gain.gain.setTargetAtTime(this.effectiveChannelVolume(settings), now, 0.18));
  }

  private connectChannel(id: string, source: AudioScheduledSourceNode, settings: ChannelSettings) {
    if (!this.context || !this.master || !this.convolver) return;
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    const dry = this.context.createGain();
    const wet = this.context.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = settings.filter;
    filter.Q.value = 0.7;
    gain.gain.value = this.effectiveChannelVolume(settings);
    dry.gain.value = 1 - settings.reverb;
    wet.gain.value = settings.reverb;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(dry);
    gain.connect(wet);
    dry.connect(this.master);
    wet.connect(this.convolver);
    this.channels.set(id, { source, gain, filter, dry, wet, settings: { ...settings } });
  }

  private effectiveChannelVolume(settings: ChannelSettings) {
    return settings.enabled ? settings.volume * (this.voiceDucked ? 0.28 : 1) : 0;
  }

  private createNoiseBuffer(kind: NoiseKind) {
    if (!this.context) throw new Error('Audio context unavailable');
    const length = this.context.sampleRate * 4;
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let brown = 0;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (kind === 'white') data[i] = white * 0.35;
      else if (kind === 'brown') {
        brown = (brown + 0.02 * white) / 1.02;
        data[i] = brown * 3.5;
      } else {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.055;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  private createImpulseResponse(seconds: number, decay: number) {
    if (!this.context) throw new Error('Audio context unavailable');
    const length = this.context.sampleRate * seconds;
    const impulse = this.context.createBuffer(2, length, this.context.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }
}
