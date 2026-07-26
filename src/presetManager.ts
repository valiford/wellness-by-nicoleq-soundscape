import { ChannelSettings, NoiseKind } from './audioEngine';
import { BowlId, BowlStyleId, bowlDefinitions, bowlSamples, bowlStyles } from './bowlSamplePlayer';

export const presetSchemaVersion = 1;
export const presetStorageKey = 'wbn-soundscape-session-presets-v1';

export type PresetChannel = ChannelSettings & {
  id: string;
  name: string;
  source: NoiseKind | 'tone';
};

export type BowlPlaybackDefaults = {
  selectedBowlId: BowlId;
  selectedStyleId: BowlStyleId;
  styleGains: Record<BowlStyleId, number>;
};

export type BowlSequenceStep =
  | { id: string; type: 'play-sample'; sampleId: string; label: string }
  | { id: string; type: 'wait'; seconds: number; label: string }
  | { id: string; type: 'fade-bowls'; label: string }
  | { id: string; type: 'stop-bowls'; label: string }
  | { id: string; type: 'master-volume'; volume: number; label: string }
  | { id: string; type: 'cue'; text: string; label: string };

export type BowlSequence = {
  id: string;
  name: string;
  steps: BowlSequenceStep[];
};

export type SessionPreset = {
  schemaVersion: number;
  id: string;
  name: string;
  builtIn?: boolean;
  channels: PresetChannel[];
  masterVolume: number;
  reverbAmount: number;
  bowlDefaults: BowlPlaybackDefaults;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  sequence?: BowlSequence;
  notes: string;
};

export type ImportedPresetBundle = {
  schemaVersion: number;
  exportedAt: string;
  presets: SessionPreset[];
};

export const defaultChannels: PresetChannel[] = [
  { id: 'foundation', name: 'Foundation', source: 'brown', enabled: true, volume: 0.18, frequency: 110, filter: 1800, reverb: 0.08 },
  { id: 'atmosphere', name: 'Atmosphere', source: 'pink', enabled: true, volume: 0.11, frequency: 220, filter: 4200, reverb: 0.18 },
  { id: 'resonance', name: 'Resonance', source: 'tone', enabled: true, volume: 0.05, frequency: 174, filter: 2400, reverb: 0.38 },
  { id: 'light', name: 'Light Tone', source: 'tone', enabled: false, volume: 0.03, frequency: 396, filter: 5000, reverb: 0.52 },
];

export const defaultBowlDefaults: BowlPlaybackDefaults = {
  selectedBowlId: 'root',
  selectedStyleId: 'regular-strike',
  styleGains: {
    'regular-strike': 0.65,
    'amplified-rim': 0.6,
    'hard-strike': 0.45,
  },
};

const cloneChannels = (channels: PresetChannel[]) => channels.map(channel => ({ ...channel }));
const cloneBowlDefaults = (defaults: BowlPlaybackDefaults): BowlPlaybackDefaults => ({
  selectedBowlId: defaults.selectedBowlId,
  selectedStyleId: defaults.selectedStyleId,
  styleGains: { ...defaults.styleGains },
});
const cloneSequence = (sequence?: BowlSequence): BowlSequence | undefined => sequence
  ? { ...sequence, steps: sequence.steps.map(step => ({ ...step })) }
  : undefined;

export function clonePreset(preset: SessionPreset): SessionPreset {
  return {
    ...preset,
    channels: cloneChannels(preset.channels),
    bowlDefaults: cloneBowlDefaults(preset.bowlDefaults),
    sequence: cloneSequence(preset.sequence),
  };
}

export function cloneBowlSequence(sequence?: BowlSequence): BowlSequence | undefined {
  return cloneSequence(sequence);
}

function makePreset(partial: Omit<SessionPreset, 'schemaVersion' | 'builtIn'>): SessionPreset {
  return { ...partial, schemaVersion: presetSchemaVersion, builtIn: true };
}

export const builtInPresets: SessionPreset[] = [
  makePreset({
    id: 'builtin-grounding',
    name: 'Grounding',
    channels: defaultChannels.map(channel => channel.id === 'foundation'
      ? { ...channel, enabled: true, volume: 0.16, reverb: 0.06 }
      : channel.id === 'atmosphere'
        ? { ...channel, enabled: false, volume: 0.08 }
        : { ...channel, enabled: false }),
    masterVolume: 0.38,
    reverbAmount: 0.12,
    bowlDefaults: { ...cloneBowlDefaults(defaultBowlDefaults), selectedBowlId: 'root' },
    fadeInSeconds: 4,
    fadeOutSeconds: 6,
    sequence: {
      id: 'seq-grounding',
      name: 'Grounding sequence',
      steps: [
        { id: 'g-cue', type: 'cue', text: 'Invite everyone to arrive and settle.', label: 'Opening cue' },
        { id: 'g-play', type: 'play-sample', sampleId: 'root-regular-strike', label: 'Root Bowl regular strike' },
        { id: 'g-wait', type: 'wait', seconds: 8, label: 'Allow resonance' },
      ],
    },
    notes: 'Begin with simple language and leave space between bowl sounds.',
  }),
  makePreset({
    id: 'builtin-heart-opening',
    name: 'Heart Opening',
    channels: defaultChannels.map(channel => channel.id === 'atmosphere'
      ? { ...channel, enabled: true, volume: 0.13, reverb: 0.24 }
      : channel.id === 'resonance'
        ? { ...channel, enabled: true, volume: 0.04, frequency: 220, reverb: 0.42 }
        : { ...channel, enabled: channel.id === 'foundation', volume: channel.id === 'foundation' ? 0.1 : channel.volume }),
    masterVolume: 0.42,
    reverbAmount: 0.34,
    bowlDefaults: { ...cloneBowlDefaults(defaultBowlDefaults), selectedBowlId: 'heart', styleGains: { 'regular-strike': 0.62, 'amplified-rim': 0.7, 'hard-strike': 0.35 } },
    fadeInSeconds: 6,
    fadeOutSeconds: 9,
    sequence: {
      id: 'seq-heart-opening',
      name: 'Heart Opening sequence',
      steps: [
        { id: 'h-cue', type: 'cue', text: 'Offer a gentle prompt for attention and breath.', label: 'Facilitator cue' },
        { id: 'h-play', type: 'play-sample', sampleId: 'heart-amplified-rim', label: 'Heart Bowl amplified rim' },
        { id: 'h-wait', type: 'wait', seconds: 10, label: 'Quiet pause' },
      ],
    },
    notes: 'Use moderate reverb and keep the sound bed supportive.',
  }),
  makePreset({
    id: 'builtin-deep-rest',
    name: 'Deep Rest',
    channels: defaultChannels.map(channel => channel.id === 'foundation'
      ? { ...channel, enabled: true, volume: 0.13, filter: 1350, reverb: 0.12 }
      : channel.id === 'atmosphere'
        ? { ...channel, enabled: true, volume: 0.08, source: 'pink' }
        : { ...channel, enabled: false }),
    masterVolume: 0.32,
    reverbAmount: 0.24,
    bowlDefaults: { ...cloneBowlDefaults(defaultBowlDefaults), selectedBowlId: 'crown', selectedStyleId: 'regular-strike', styleGains: { 'regular-strike': 0.48, 'amplified-rim': 0.42, 'hard-strike': 0 } },
    fadeInSeconds: 10,
    fadeOutSeconds: 14,
    sequence: {
      id: 'seq-deep-rest',
      name: 'Deep Rest sequence',
      steps: [
        { id: 'd-cue', type: 'cue', text: 'Let the room know there will be more silence.', label: 'Rest cue' },
        { id: 'd-wait', type: 'wait', seconds: 12, label: 'Silent space' },
        { id: 'd-play', type: 'play-sample', sampleId: 'crown-regular-strike', label: 'Crown Bowl regular strike' },
      ],
    },
    notes: 'Keep levels low and avoid hard strikes by default.',
  }),
  makePreset({
    id: 'builtin-closing-integration',
    name: 'Closing Integration',
    channels: defaultChannels.map(channel => channel.id === 'foundation'
      ? { ...channel, enabled: true, volume: 0.08, reverb: 0.04 }
      : channel.id === 'light'
        ? { ...channel, enabled: true, volume: 0.02, frequency: 528, reverb: 0.16 }
        : { ...channel, enabled: false }),
    masterVolume: 0.28,
    reverbAmount: 0.12,
    bowlDefaults: { ...cloneBowlDefaults(defaultBowlDefaults), selectedBowlId: 'heart', styleGains: { 'regular-strike': 0.44, 'amplified-rim': 0.36, 'hard-strike': 0.2 } },
    fadeInSeconds: 4,
    fadeOutSeconds: 16,
    sequence: {
      id: 'seq-closing-integration',
      name: 'Closing Integration sequence',
      steps: [
        { id: 'c-cue', type: 'cue', text: 'Invite a quiet final pause before closing.', label: 'Closing cue' },
        { id: 'c-volume', type: 'master-volume', volume: 0.2, label: 'Lower room level' },
        { id: 'c-wait', type: 'wait', seconds: 8, label: 'Final pause' },
        { id: 'c-fade', type: 'fade-bowls', label: 'Fade bowls' },
      ],
    },
    notes: 'Use sparse bowl sounds and a gradual fade out.',
  }),
];

const validBowlIds = new Set(bowlDefinitions.map(bowl => bowl.id));
const validStyleIds = new Set(bowlStyles.map(style => style.id));
const validSampleIds = new Set(bowlSamples.map(sample => sample.id));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validNumber(value: unknown, min: number, max: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function validatePreset(value: unknown, ids: Set<string>, index: number): SessionPreset {
  if (!isRecord(value)) throw new Error(`Preset ${index + 1} must be an object.`);
  const { id, name, channels, masterVolume, reverbAmount, bowlDefaults, fadeInSeconds, fadeOutSeconds, sequence, notes } = value;
  if (typeof id !== 'string' || id.trim() === '') throw new Error(`Preset ${index + 1} is missing an id.`);
  if (ids.has(id)) throw new Error(`Duplicate preset id "${id}" was found.`);
  ids.add(id);
  if (typeof name !== 'string' || name.trim() === '') throw new Error(`Preset "${id}" is missing a name.`);
  if (!Array.isArray(channels) || channels.length === 0) throw new Error(`Preset "${name}" must include channels.`);
  const parsedChannels = channels.map((channel, channelIndex) => {
    if (!isRecord(channel)) throw new Error(`Channel ${channelIndex + 1} in "${name}" must be an object.`);
    if (typeof channel.id !== 'string' || typeof channel.name !== 'string') throw new Error(`Channel ${channelIndex + 1} in "${name}" is missing id or name.`);
    if (!['white', 'pink', 'brown', 'tone'].includes(String(channel.source))) throw new Error(`Channel "${channel.id}" in "${name}" has an unsupported source.`);
    if (typeof channel.enabled !== 'boolean') throw new Error(`Channel "${channel.id}" in "${name}" must include enabled.`);
    for (const key of ['volume', 'frequency', 'filter', 'reverb'] as const) {
      if (!validNumber(channel[key], key === 'volume' || key === 'reverb' ? 0 : 1, key === 'volume' ? 0.35 : key === 'reverb' ? 0.8 : 12000)) {
        throw new Error(`Channel "${channel.id}" in "${name}" has an invalid ${key}.`);
      }
    }
    return channel as PresetChannel;
  });
  if (!validNumber(masterVolume, 0, 0.8)) throw new Error(`Preset "${name}" has an invalid master volume.`);
  if (!validNumber(reverbAmount, 0, 0.8)) throw new Error(`Preset "${name}" has an invalid reverb setting.`);
  if (!validNumber(fadeInSeconds, 0, 60) || !validNumber(fadeOutSeconds, 0, 90)) throw new Error(`Preset "${name}" has invalid fade durations.`);
  if (!isRecord(bowlDefaults)) throw new Error(`Preset "${name}" is missing bowl defaults.`);
  if (typeof bowlDefaults.selectedBowlId !== 'string' || !validBowlIds.has(bowlDefaults.selectedBowlId as BowlId)) throw new Error(`Preset "${name}" has an invalid selected bowl.`);
  if (typeof bowlDefaults.selectedStyleId !== 'string' || !validStyleIds.has(bowlDefaults.selectedStyleId as BowlStyleId)) throw new Error(`Preset "${name}" has an invalid selected style.`);
  if (!isRecord(bowlDefaults.styleGains)) throw new Error(`Preset "${name}" has invalid bowl gain defaults.`);
  const styleGains = {} as Record<BowlStyleId, number>;
  for (const style of bowlStyles) {
    const gain = bowlDefaults.styleGains[style.id];
    if (!validNumber(gain, 0, 1)) throw new Error(`Preset "${name}" has an invalid ${style.name} gain.`);
    styleGains[style.id] = gain as number;
  }
  const parsedSequence = sequence === undefined ? undefined : validateSequence(sequence, String(name));
  return {
    schemaVersion: presetSchemaVersion,
    id,
    name,
    channels: cloneChannels(parsedChannels),
    masterVolume: masterVolume as number,
    reverbAmount: reverbAmount as number,
    bowlDefaults: {
      selectedBowlId: bowlDefaults.selectedBowlId as BowlId,
      selectedStyleId: bowlDefaults.selectedStyleId as BowlStyleId,
      styleGains,
    },
    fadeInSeconds: fadeInSeconds as number,
    fadeOutSeconds: fadeOutSeconds as number,
    sequence: parsedSequence,
    notes: typeof notes === 'string' ? notes : '',
  };
}

function validateSequence(value: unknown, presetName: string): BowlSequence {
  if (!isRecord(value)) throw new Error(`Sequence in "${presetName}" must be an object.`);
  if (typeof value.id !== 'string' || typeof value.name !== 'string') throw new Error(`Sequence in "${presetName}" is missing id or name.`);
  if (!Array.isArray(value.steps)) throw new Error(`Sequence in "${presetName}" must include steps.`);
  const stepIds = new Set<string>();
  const steps = value.steps.map((step, index) => {
    if (!isRecord(step)) throw new Error(`Step ${index + 1} in "${presetName}" must be an object.`);
    if (typeof step.id !== 'string' || stepIds.has(step.id)) throw new Error(`Step ${index + 1} in "${presetName}" has a missing or duplicate id.`);
    stepIds.add(step.id);
    if (typeof step.label !== 'string' || step.label.trim() === '') throw new Error(`Step ${index + 1} in "${presetName}" is missing a label.`);
    if (step.type === 'play-sample') {
      if (typeof step.sampleId !== 'string' || !validSampleIds.has(step.sampleId)) throw new Error(`Step "${step.label}" has an invalid bowl sample.`);
      return step as BowlSequenceStep;
    }
    if (step.type === 'wait') {
      if (!validNumber(step.seconds, 0.5, 3600)) throw new Error(`Step "${step.label}" has an invalid wait duration.`);
      return step as BowlSequenceStep;
    }
    if (step.type === 'fade-bowls' || step.type === 'stop-bowls') return step as BowlSequenceStep;
    if (step.type === 'master-volume') {
      if (!validNumber(step.volume, 0, 0.8)) throw new Error(`Step "${step.label}" has an invalid master volume.`);
      return step as BowlSequenceStep;
    }
    if (step.type === 'cue') {
      if (typeof step.text !== 'string' || step.text.trim() === '') throw new Error(`Cue step "${step.label}" must include cue text.`);
      return step as BowlSequenceStep;
    }
    throw new Error(`Step ${index + 1} in "${presetName}" has an unsupported type.`);
  });
  return { id: value.id, name: value.name, steps };
}

export function loadStoredPresets(storage: Storage): SessionPreset[] {
  try {
    const raw = storage.getItem(presetStorageKey);
    if (!raw) return [];
    return parsePresetBundle(raw).presets;
  } catch {
    return [];
  }
}

export function saveStoredPresets(storage: Storage, presets: SessionPreset[]): boolean {
  const bundle: ImportedPresetBundle = {
    schemaVersion: presetSchemaVersion,
    exportedAt: new Date().toISOString(),
    presets: presets.map(preset => ({ ...clonePreset(preset), builtIn: false })),
  };
  try {
    storage.setItem(presetStorageKey, JSON.stringify(bundle));
    return true;
  } catch {
    return false;
  }
}

export function exportPresetBundle(presets: SessionPreset[]): string {
  return JSON.stringify({
    schemaVersion: presetSchemaVersion,
    exportedAt: new Date().toISOString(),
    presets: presets.map(clonePreset),
  }, null, 2);
}

export function parsePresetBundle(raw: string): ImportedPresetBundle {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('The imported file is not valid JSON.');
  }
  if (!isRecord(parsed)) throw new Error('The imported JSON must be an object.');
  if (parsed.schemaVersion !== presetSchemaVersion) throw new Error(`Unsupported preset schema version. This app supports version ${presetSchemaVersion}.`);
  if (!Array.isArray(parsed.presets)) throw new Error('The imported JSON must include a presets array.');
  const ids = new Set<string>();
  const presets = parsed.presets.map((preset, index) => validatePreset(preset, ids, index));
  return {
    schemaVersion: presetSchemaVersion,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
    presets,
  };
}

export function createPresetFromState(
  name: string,
  channels: PresetChannel[],
  masterVolume: number,
  reverbAmount: number,
  bowlDefaults: BowlPlaybackDefaults,
  fadeInSeconds: number,
  fadeOutSeconds: number,
  sequence: BowlSequence | undefined,
  notes: string,
): SessionPreset {
  const id = `preset-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  return {
    schemaVersion: presetSchemaVersion,
    id,
    name,
    channels: cloneChannels(channels),
    masterVolume,
    reverbAmount,
    bowlDefaults: cloneBowlDefaults(bowlDefaults),
    fadeInSeconds,
    fadeOutSeconds,
    sequence: cloneSequence(sequence),
    notes,
  };
}
