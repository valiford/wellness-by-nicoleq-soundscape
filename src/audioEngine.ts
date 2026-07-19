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
};

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private convolver: ConvolverNode | null = null;
  private channels = new Map<string, ChannelNodes>();

  async start(masterVolume = 0.45) {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = masterVolume;
      this.master.connect(this.context.destination);
      this.convolver = this.context.createConvolver();
      this.convolver.buffer = this.createImpulseResponse(2.2, 2.4);
      this.convolver.connect(this.master);
    }
    if (this.context.state === 'suspended') await this.context.resume();
  }

  stopAll() {
    this.channels.forEach(({ source }) => {
      try { source.stop(); } catch { /* already stopped */ }
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

  updateChannel(id: string, settings: ChannelSettings) {
    const node = this.channels.get(id);
    if (!node || !this.context) return;
    const now = this.context.currentTime;
    node.gain.gain.setTargetAtTime(settings.enabled ? settings.volume : 0, now, 0.03);
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
    this.channels.delete(id);
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
    gain.gain.value = settings.enabled ? settings.volume : 0;
    dry.gain.value = 1 - settings.reverb;
    wet.gain.value = settings.reverb;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(dry);
    gain.connect(wet);
    dry.connect(this.master);
    wet.connect(this.convolver);
    this.channels.set(id, { source, gain, filter, dry, wet });
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
