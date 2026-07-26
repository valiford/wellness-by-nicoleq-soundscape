import { useEffect, useMemo, useState } from 'react';
import {
  BowlPlaybackDefaults,
  BowlSequence,
  PresetChannel,
  SessionPreset,
  builtInPresets,
  cloneBowlSequence,
  clonePreset,
  createPresetFromState,
  exportPresetBundle,
  loadStoredPresets,
  parsePresetBundle,
  saveStoredPresets,
} from './presetManager';

export type PresetSessionState = {
  channels: PresetChannel[];
  master: number;
  reverbAmount: number;
  bowlDefaults: BowlPlaybackDefaults;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  sequence: BowlSequence | undefined;
  notes: string;
};

type UseSessionPresetsOptions = {
  getSessionState: () => PresetSessionState;
  onApplyPreset: (preset: SessionPreset) => void;
  confirmBeforeReplacing: () => boolean;
  onAnnouncement: (message: string) => void;
  onBeforeReplace: () => void;
};

const builtIn = builtInPresets.map(clonePreset);
const builtInIds = new Set(builtIn.map(preset => preset.id));

export const initialPreset = clonePreset(builtIn[0]);
export const initialSequence = cloneBowlSequence(initialPreset.sequence);

export function useSessionPresets({
  getSessionState,
  onApplyPreset,
  confirmBeforeReplacing,
  onAnnouncement,
  onBeforeReplace,
}: UseSessionPresetsOptions) {
  const [customPresets, setCustomPresets] = useState<SessionPreset[]>(() => {
    if (typeof window === 'undefined') return [];
    return loadStoredPresets(window.localStorage);
  });
  const [selectedPresetId, setSelectedPresetId] = useState(initialPreset.id);
  const [presetName, setPresetName] = useState(initialPreset.name);
  const [importText, setImportText] = useState('');
  const [exportText, setExportText] = useState('');

  const allPresets = useMemo(() => [...builtIn, ...customPresets.map(clonePreset)], [customPresets]);
  const selectedPreset = allPresets.find(item => item.id === selectedPresetId) ?? allPresets[0];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = saveStoredPresets(window.localStorage, customPresets);
    if (!stored) onAnnouncement('Preset changes could not be saved in this browser storage.');
  }, [customPresets, onAnnouncement]);

  const applyPreset = (preset: SessionPreset) => {
    const next = clonePreset(preset);
    setSelectedPresetId(next.id);
    setPresetName(next.name);
    onApplyPreset(next);
    onAnnouncement(`${next.name} preset loaded.`);
  };

  const selectPreset = (id: string) => {
    if (!confirmBeforeReplacing()) return;
    onBeforeReplace();
    const next = allPresets.find(item => item.id === id);
    if (next) applyPreset(next);
  };

  const resetToDefaults = () => {
    if (!confirmBeforeReplacing()) return;
    onBeforeReplace();
    applyPreset(builtIn[0]);
    onAnnouncement('Current setup reset to the Grounding defaults.');
  };

  const savePreset = () => {
    const state = getSessionState();
    const next = createPresetFromState(presetName.trim() || 'Untitled preset', state.channels, state.master, state.reverbAmount, state.bowlDefaults, state.fadeInSeconds, state.fadeOutSeconds, state.sequence, state.notes);
    setCustomPresets(current => [...current, next]);
    setSelectedPresetId(next.id);
    onAnnouncement(`${next.name} preset saved.`);
  };

  const duplicatePreset = () => {
    const state = getSessionState();
    const next = createPresetFromState(`${selectedPreset.name} copy`, state.channels, state.master, state.reverbAmount, state.bowlDefaults, state.fadeInSeconds, state.fadeOutSeconds, state.sequence, state.notes);
    setCustomPresets(current => [...current, next]);
    setSelectedPresetId(next.id);
    setPresetName(next.name);
    onAnnouncement(`${selectedPreset.name} duplicated.`);
  };

  const renamePreset = () => {
    const name = presetName.trim();
    if (!name) {
      onAnnouncement('Preset name is required before renaming.');
      return;
    }
    if (selectedPreset.builtIn) {
      const state = getSessionState();
      const next = createPresetFromState(name, state.channels, state.master, state.reverbAmount, state.bowlDefaults, state.fadeInSeconds, state.fadeOutSeconds, state.sequence, state.notes);
      setCustomPresets(current => [...current, next]);
      setSelectedPresetId(next.id);
      onAnnouncement('Built-in preset saved as a renamed copy.');
      return;
    }
    setCustomPresets(current => current.map(item => item.id === selectedPresetId ? { ...item, name } : item));
    onAnnouncement(`Preset renamed to ${name}.`);
  };

  const deletePreset = () => {
    if (selectedPreset.builtIn) {
      onAnnouncement('Built-in presets cannot be deleted.');
      return;
    }
    setCustomPresets(current => current.filter(item => item.id !== selectedPresetId));
    applyPreset(builtIn[0]);
    onAnnouncement('Preset deleted.');
  };

  const exportPresets = () => {
    setExportText(exportPresetBundle(allPresets));
    onAnnouncement('Preset JSON export is ready.');
  };

  const importPresets = () => {
    try {
      const bundle = parsePresetBundle(importText);
      const collidingBuiltIn = bundle.presets.find(preset => builtInIds.has(preset.id));
      if (collidingBuiltIn) throw new Error(`Imported preset "${collidingBuiltIn.name}" uses a built-in preset id.`);
      setCustomPresets(current => {
        const importedIds = new Set(bundle.presets.map(preset => preset.id));
        return [...current.filter(preset => !importedIds.has(preset.id)), ...bundle.presets.map(preset => ({ ...preset, builtIn: false }))];
      });
      onAnnouncement(`${bundle.presets.length} preset${bundle.presets.length === 1 ? '' : 's'} imported.`);
    } catch (error) {
      onAnnouncement(error instanceof Error ? error.message : 'Preset import failed.');
    }
  };

  return {
    allPresets,
    selectedPreset,
    selectedPresetId,
    presetName,
    importText,
    exportText,
    setPresetName,
    setImportText,
    selectPreset,
    resetToDefaults,
    savePreset,
    duplicatePreset,
    renamePreset,
    deletePreset,
    exportPresets,
    importPresets,
  };
}
