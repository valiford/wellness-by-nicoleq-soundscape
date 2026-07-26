import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioEngine } from './audioEngine';
import { BowlId, BowlSamplePlayer, BowlStyleId, SamplePlaybackSnapshot, bowlDefinitions, bowlSamples, bowlStyles } from './bowlSamplePlayer';
import {
  BowlPlaybackDefaults,
  BowlSequence,
  PresetChannel,
  SessionPreset,
  cloneBowlSequence,
  defaultBowlDefaults,
  presetSchemaVersion,
  presetStorageKey,
} from './presetManager';
import { SequenceSnapshot } from './sequenceRunner';
import ExperienceMode from './ExperienceMode';
import { initialPreset, initialSequence, useSessionPresets } from './useSessionPresets';
import { SequenceDraft, emptySequence, stepLabel, useSequenceRunner } from './useSequenceRunner';

type PresentationMode = 'simple' | 'advanced';
type ClientMode = 'facilitator' | 'experience';
type SessionStatus = 'Stopped' | 'Active' | 'Fading' | 'Muted';
type SampleStatus = 'Idle' | 'Loading' | 'Ready' | 'Error';

const modeStorageKey = 'wbn-soundscape-client-mode';

const getStoredMode = (): ClientMode => {
  if (typeof window === 'undefined') return 'facilitator';
  try {
    return window.localStorage.getItem(modeStorageKey) === 'experience' ? 'experience' : 'facilitator';
  } catch {
    return 'facilitator';
  }
};

export default function App() {
  const engine = useMemo(() => new AudioEngine(), []);
  const bowlPlayer = useMemo(() => new BowlSamplePlayer(() => engine.getSampleDestination(master)), [engine]);
  const fadeTimeoutRef = useRef<number | null>(null);
  const lastNonZeroMasterRef = useRef(initialPreset.masterVolume);
  const [started, setStarted] = useState(false);
  const [channels, setChannels] = useState<PresetChannel[]>(initialPreset.channels);
  const [master, setMaster] = useState(initialPreset.masterVolume);
  const [reverbAmount, setReverbAmount] = useState(initialPreset.reverbAmount);
  const [fadeInSeconds, setFadeInSeconds] = useState(initialPreset.fadeInSeconds);
  const [fadeOutSeconds, setFadeOutSeconds] = useState(initialPreset.fadeOutSeconds);
  const [bowlDefaults, setBowlDefaults] = useState<BowlPlaybackDefaults>(initialPreset.bowlDefaults);
  const [notes, setNotes] = useState(initialPreset.notes);
  const [sequence, setSequence] = useState<BowlSequence | undefined>(initialSequence);
  const [clientMode, setClientMode] = useState<ClientMode>(getStoredMode);
  const [detailMode, setDetailMode] = useState<PresentationMode>('simple');
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('Stopped');
  const [sampleStatus, setSampleStatus] = useState<SampleStatus>('Idle');
  const [sampleError, setSampleError] = useState('');
  const [activeSamples, setActiveSamples] = useState<SamplePlaybackSnapshot[]>([]);
  const [announcement, setAnnouncement] = useState('');

  const cancelFadeTimeout = () => {
    if (fadeTimeoutRef.current === null) return;
    window.clearTimeout(fadeTimeoutRef.current);
    fadeTimeoutRef.current = null;
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(modeStorageKey, clientMode);
    } catch {
      setAnnouncement('Display mode could not be saved in this browser storage.');
    }
  }, [clientMode]);

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

  const applySessionPreset = useCallback((next: SessionPreset) => {
    setChannels(next.channels);
    setMaster(next.masterVolume);
    setReverbAmount(next.reverbAmount);
    setFadeInSeconds(next.fadeInSeconds);
    setFadeOutSeconds(next.fadeOutSeconds);
    setBowlDefaults(next.bowlDefaults);
    setNotes(next.notes);
    setSequence(cloneBowlSequence(next.sequence));
    lastNonZeroMasterRef.current = next.masterVolume || lastNonZeroMasterRef.current;
    engine.setMasterVolume(next.masterVolume);
    if (started) {
      next.channels.forEach(channel => engine.updateChannel(channel.id, channel));
      setSessionStatus(next.masterVolume === 0 ? 'Muted' : 'Active');
    }
  }, [engine, started]);

  const update = (id: string, patch: Partial<PresetChannel>) => {
    setChannels(current => current.map(channel => {
      if (channel.id !== id) return channel;
      const updated = { ...channel, ...patch };
      if (started) engine.updateChannel(id, updated);
      return updated;
    }));
  };

  const start = async () => {
    await engine.start(master);
    channels.filter(channel => channel.enabled).forEach(channel => {
      if (channel.source === 'tone') engine.addTone(channel.id, 'sine', channel);
      else engine.addNoise(channel.id, channel.source, channel);
    });
    setStarted(true);
    setSessionStatus(master === 0 ? 'Muted' : 'Active');
    setAnnouncement('Audio started.');
  };

  const stop = () => {
    cancelFadeTimeout();
    runner.stop(false);
    engine.stopAll();
    bowlPlayer.stopAll();
    setActiveSamples([]);
    setStarted(false);
    setSessionStatus('Stopped');
    setAnnouncement('Audio stopped.');
  };

  const setMasterVolume = (value: number) => {
    cancelFadeTimeout();
    setMaster(value);
    if (value > 0) lastNonZeroMasterRef.current = value;
    engine.setMasterVolume(value);
    if (started) setSessionStatus(value === 0 ? 'Muted' : 'Active');
  };

  const setGlobalReverb = (value: number) => {
    setReverbAmount(value);
    setChannels(current => current.map(channel => {
      const updated = { ...channel, reverb: value };
      if (started) engine.updateChannel(channel.id, updated);
      return updated;
    }));
  };

  const muteAll = () => {
    cancelFadeTimeout();
    setMaster(0);
    engine.setMasterVolume(0);
    setActiveSamples(bowlPlayer.muteAll());
    if (started) setSessionStatus('Muted');
    setAnnouncement('Mute all is active.');
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

  const fadeOut = () => fadeMaster(0, fadeOutSeconds, 'Muted');
  const fadeIn = () => fadeMaster(lastNonZeroMasterRef.current || selectedPreset.masterVolume || 0.45, fadeInSeconds, 'Active');

  const removeActiveSample = (id: string) => {
    setActiveSamples(current => current.filter(sample => sample.id !== id));
  };

  const replaceActiveSample = (snapshot: SamplePlaybackSnapshot | null) => {
    if (!snapshot) return;
    setActiveSamples(current => current.map(sample => sample.id === snapshot.id ? snapshot : sample));
  };

  const sampleVolume = (sampleId: string) => {
    const sample = bowlSamples.find(item => item.id === sampleId);
    if (!sample) return defaultBowlDefaults.styleGains['regular-strike'];
    return bowlDefaults.styleGains[sample.styleId];
  };

  const playBowl = async (sampleId: string, volumeOverride?: number) => {
    const sample = bowlSamples.find(item => item.id === sampleId);
    if (!sample || !started) return;
    try {
      const playback = await bowlPlayer.play(sample, removeActiveSample, volumeOverride ?? sampleVolume(sampleId));
      if (playback) setActiveSamples(current => [playback, ...current]);
      setSampleStatus('Ready');
      setSampleError('');
    } catch {
      setSampleStatus('Error');
      setSampleError('That bowl file could not load. Please check the audio folder before using this sample in-session.');
    }
  };

  const updateExperienceVolume = (bowlId: BowlId, volume: number) => {
    setActiveSamples(current => current.map(sample => {
      if (!sample.sampleId.startsWith(`${bowlId}-`)) return sample;
      return bowlPlayer.setVolume(sample.id, volume) ?? sample;
    }));
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

  const updateBowlDefault = (patch: Partial<BowlPlaybackDefaults>) => {
    setBowlDefaults(current => ({ ...current, ...patch, styleGains: patch.styleGains ?? current.styleGains }));
  };

  const changeClientMode = (mode: ClientMode) => {
    if (mode === 'experience' && clientMode !== 'experience') {
      engine.stopAll();
      setChannels(current => current.map(channel => ({ ...channel, enabled: false })));
      setAnnouncement('Experience Mode keeps generated channels off.');
    }
    setClientMode(mode);
  };

  useEffect(() => {
    if (clientMode !== 'experience') return;
    engine.stopAll();
    setChannels(current => current.every(channel => !channel.enabled)
      ? current
      : current.map(channel => ({ ...channel, enabled: false })));
  }, [clientMode, engine]);

  const {
    runner,
    sequenceSnapshot,
    sequenceDraft,
    setSequenceDraft,
    startSequence,
    clearSequence,
    addSequenceStep,
    removeSequenceStep,
    moveSequenceStep,
  } = useSequenceRunner({
    initialMaster: initialPreset.masterVolume,
    onAnnouncement: setAnnouncement,
    actions: {
      onPlaySample: playBowl,
      onFadeBowls: fadeAllBowls,
      onStopBowls: stopAllBowls,
      onMasterVolume: setMasterVolume,
    },
  });

  const confirmBeforeReplacingPreset = useCallback(() => {
    if (sequenceSnapshot.status !== 'Running' && sequenceSnapshot.status !== 'Paused') return true;
    return window.confirm('A sequence is running. Loading another preset will stop it. Continue?');
  }, [sequenceSnapshot.status]);

  const {
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
  } = useSessionPresets({
    getSessionState: () => ({ channels, master, reverbAmount, bowlDefaults, fadeInSeconds, fadeOutSeconds, sequence, notes }),
    onApplyPreset: applySessionPreset,
    confirmBeforeReplacing: confirmBeforeReplacingPreset,
    onAnnouncement: setAnnouncement,
    onBeforeReplace: () => runner.stop(false),
  });

  useEffect(() => () => {
    cancelFadeTimeout();
    runner.stop(false);
    engine.stopAll();
    bowlPlayer.stopAll();
  }, [bowlPlayer, engine, runner]);

  const currentSequence = sequence ?? emptySequence;
  const activeChannels = channels.filter(channel => channel.enabled).length;

  return (
    <main>
      <AppHeader />

      <SessionBar
        started={started}
        sessionStatus={sessionStatus}
        onStart={start}
        onStop={stop}
        onFadeIn={fadeIn}
        onFadeOut={fadeOut}
        onMute={muteAll}
      />

      <div className="announcer" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>

      <ModeToggle clientMode={clientMode} detailMode={detailMode} onClientModeChange={changeClientMode} onDetailModeChange={setDetailMode} />

      {clientMode === 'experience' ? (
        <ExperienceMode
          started={started}
          master={master}
          analyser={engine.getAnalyser()}
          activeSamples={activeSamples}
          onPlay={playBowl}
          onVolumeChange={updateExperienceVolume}
          onMute={toggleBowlMute}
          onStop={stopBowl}
        />
      ) : <>
      <PresetPanel
        allPresets={allPresets}
        selectedPresetId={selectedPresetId}
        selectedPreset={selectedPreset}
        presetName={presetName}
        importText={importText}
        exportText={exportText}
        schemaVersion={presetSchemaVersion}
        storageKey={presetStorageKey}
        onSelectPreset={selectPreset}
        onPresetName={setPresetName}
        onSave={savePreset}
        onDuplicate={duplicatePreset}
        onRename={renamePreset}
        onDelete={deletePreset}
        onReset={resetToDefaults}
        onExport={exportPresets}
        onImportText={setImportText}
        onImport={importPresets}
      />

      <SequencePanel
        sequence={currentSequence}
        started={started}
        snapshot={sequenceSnapshot}
        draft={sequenceDraft}
        onDraft={setSequenceDraft}
        onStart={() => startSequence(started, sequence)}
        onPause={() => runner.pause()}
        onResume={() => runner.resume()}
        onSkip={() => runner.skip()}
        onPrevious={() => runner.previous()}
        onStop={() => runner.stop()}
        onClear={() => clearSequence(setSequence)}
        onAdd={() => addSequenceStep(setSequence)}
        onRemove={id => removeSequenceStep(setSequence, id)}
        onMove={(id, direction) => moveSequenceStep(setSequence, id, direction)}
      />

      <MasterControl
        master={master}
        reverbAmount={reverbAmount}
        fadeInSeconds={fadeInSeconds}
        fadeOutSeconds={fadeOutSeconds}
        sessionStatus={sessionStatus}
        started={started}
        activeChannels={activeChannels}
        onChange={setMasterVolume}
        onReverbChange={setGlobalReverb}
        onFadeInSeconds={setFadeInSeconds}
        onFadeOutSeconds={setFadeOutSeconds}
      />

      <BowlPlayer
        activeSamples={activeSamples}
        sampleStatus={sampleStatus}
        sampleError={sampleError}
        started={started}
        bowlDefaults={bowlDefaults}
        onDefaultsChange={updateBowlDefault}
        onPlay={playBowl}
        onVolumeChange={updateBowlVolume}
        onMuteChange={toggleBowlMute}
        onStop={stopBowl}
        onFadeOut={fadeBowl}
        onStopAll={stopAllBowls}
        onFadeAll={fadeAllBowls}
      />

      <section className="channels" aria-label="Sound channels">
        {channels.map(channel => (
          <ChannelCard
            channel={channel}
            key={channel.id}
            mode={detailMode}
            isActive={started && channel.enabled && master > 0}
            onChange={patch => update(channel.id, patch)}
          />
        ))}
      </section>

      <section className="facilitator-notes" aria-label="Facilitator notes">
        <label>
          <span>Facilitator notes</span>
          <textarea value={notes} onChange={event => setNotes(event.target.value)} rows={3} />
        </label>
      </section>

      <footer>
        <p>Designed to support relaxation and guided wellness sessions. Not medical or audiological treatment.</p>
      </footer>
      </>}
    </main>
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

function SessionBar({ started, sessionStatus, onStart, onStop, onFadeIn, onFadeOut, onMute }: {
  started: boolean;
  sessionStatus: SessionStatus;
  onStart: () => void;
  onStop: () => void;
  onFadeIn: () => void;
  onFadeOut: () => void;
  onMute: () => void;
}) {
  return (
    <section className="session-bar" aria-label="Session controls">
      {!started
        ? <button className="primary action-main" onClick={onStart}>Start audio</button>
        : <button className="stop action-main" onClick={onStop}>Stop audio</button>}
      <button onClick={onFadeIn} disabled={!started}>Fade in</button>
      <button onClick={onFadeOut} disabled={!started}>Fade out</button>
      <button className="danger mute-all" onClick={onMute} disabled={!started}>Mute all</button>
      <div className={`live-status ${sessionStatus.toLowerCase()}`} aria-live="polite">
        <span aria-hidden="true" />
        {sessionStatus}
      </div>
    </section>
  );
}

function PresetPanel({
  allPresets,
  selectedPresetId,
  selectedPreset,
  presetName,
  importText,
  exportText,
  schemaVersion,
  storageKey,
  onSelectPreset,
  onPresetName,
  onSave,
  onDuplicate,
  onRename,
  onDelete,
  onReset,
  onExport,
  onImportText,
  onImport,
}: {
  allPresets: SessionPreset[];
  selectedPresetId: string;
  selectedPreset: SessionPreset;
  presetName: string;
  importText: string;
  exportText: string;
  schemaVersion: number;
  storageKey: string;
  onSelectPreset: (id: string) => void;
  onPresetName: (value: string) => void;
  onSave: () => void;
  onDuplicate: () => void;
  onRename: () => void;
  onDelete: () => void;
  onReset: () => void;
  onExport: () => void;
  onImportText: (value: string) => void;
  onImport: () => void;
}) {
  return (
    <section className="preset-panel" aria-label="Preset library">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Presets</p>
          <h2>Repeatable setups</h2>
          <p>Schema v{schemaVersion} · localStorage key: {storageKey}</p>
        </div>
        {selectedPreset.builtIn && <span className="pill">Built-in</span>}
      </div>
      <div className="preset-grid">
        <label className="preset-control">
          <span>Session preset</span>
          <select value={selectedPresetId} onChange={event => onSelectPreset(event.target.value)}>
            {allPresets.map(preset => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
          </select>
        </label>
        <label className="preset-control">
          <span>Preset name</span>
          <input value={presetName} onChange={event => onPresetName(event.target.value)} />
        </label>
        <div className="preset-actions" role="group" aria-label="Preset actions">
          <button onClick={onSave}>Save current</button>
          <button onClick={onDuplicate}>Duplicate</button>
          <button onClick={onRename}>Rename</button>
          <button className="stop" onClick={onDelete}>Delete</button>
          <button onClick={onReset}>Reset defaults</button>
        </div>
      </div>
      <details className="json-tools">
        <summary>Import and export JSON</summary>
        <div className="json-grid">
          <label>
            <span>Import JSON</span>
            <textarea value={importText} onChange={event => onImportText(event.target.value)} rows={5} />
          </label>
          <label>
            <span>Export JSON</span>
            <textarea readOnly value={exportText} rows={5} />
          </label>
        </div>
        <div className="preset-actions">
          <button onClick={onImport}>Import presets</button>
          <button onClick={onExport}>Export presets</button>
        </div>
      </details>
    </section>
  );
}

function SequencePanel({
  sequence,
  started,
  snapshot,
  draft,
  onDraft,
  onStart,
  onPause,
  onResume,
  onSkip,
  onPrevious,
  onStop,
  onClear,
  onAdd,
  onRemove,
  onMove,
}: {
  sequence: BowlSequence;
  started: boolean;
  snapshot: SequenceSnapshot;
  draft: SequenceDraft;
  onDraft: (draft: SequenceDraft) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onPrevious: () => void;
  onStop: () => void;
  onClear: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}) {
  const running = snapshot.status === 'Running';
  const paused = snapshot.status === 'Paused';

  return (
    <section className="sequence-panel" aria-label="Sequence mode">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Sequence mode</p>
          <h2>Bowl sequence</h2>
          <p>{sequence.steps.length} step{sequence.steps.length === 1 ? '' : 's'} · starts only when audio is started and Start sequence is pressed</p>
        </div>
        <span className={`sequence-status ${snapshot.status.toLowerCase()}`}>{snapshot.status}</span>
      </div>

      <div className="sequence-readout" aria-live="polite">
        <p><strong>Current:</strong> {stepLabel(snapshot.currentStep)}</p>
        <p><strong>Next:</strong> {stepLabel(snapshot.nextStep)}</p>
        <p><strong>Elapsed:</strong> {snapshot.elapsedSeconds}s</p>
        <p><strong>Wait remaining:</strong> {snapshot.remainingWaitSeconds}s</p>
      </div>

      {snapshot.currentStep?.type === 'cue' && <p className="cue-step" role="note">{snapshot.currentStep.text}</p>}

      <div className="sequence-actions" role="group" aria-label="Sequence controls">
        <button className="primary" onClick={onStart} disabled={!started || sequence.steps.length === 0 || running}>Start sequence</button>
        <button onClick={onPause} disabled={!running}>Pause</button>
        <button onClick={onResume} disabled={!paused}>Resume</button>
        <button onClick={onSkip} disabled={!running && !paused}>Skip step</button>
        <button onClick={onPrevious} disabled={!running && !paused}>Previous step</button>
        <button className="stop" onClick={onStop} disabled={!running && !paused}>Stop sequence</button>
        <button onClick={onClear}>Clear sequence</button>
      </div>

      <details className="sequence-editor">
        <summary>Edit sequence</summary>
        <div className="sequence-list">
          {sequence.steps.length === 0 ? <p>No sequence steps yet.</p> : sequence.steps.map((step, index) => (
            <article className={step.type === 'cue' ? 'sequence-step cue' : 'sequence-step'} key={step.id}>
              <span>{index + 1}</span>
              <p>{stepLabel(step)}</p>
              <div>
                <button onClick={() => onMove(step.id, -1)} disabled={index === 0}>Up</button>
                <button onClick={() => onMove(step.id, 1)} disabled={index === sequence.steps.length - 1}>Down</button>
                <button className="stop" onClick={() => onRemove(step.id)}>Remove</button>
              </div>
            </article>
          ))}
        </div>
        <div className="step-editor">
          <label>
            <span>Step type</span>
            <select value={draft.type} onChange={event => onDraft({ ...draft, type: event.target.value as SequenceDraft['type'] })}>
              <option value="cue">Facilitator cue</option>
              <option value="play-sample">Play bowl sample</option>
              <option value="wait">Wait</option>
              <option value="fade-bowls">Fade out active bowls</option>
              <option value="stop-bowls">Stop active bowls</option>
              <option value="master-volume">Change master volume</option>
            </select>
          </label>
          {draft.type === 'play-sample' && (
            <label>
              <span>Bowl sample</span>
              <select value={draft.sampleId} onChange={event => onDraft({ ...draft, sampleId: event.target.value })}>
                {bowlSamples.map(sample => <option key={sample.id} value={sample.id}>{sample.label}</option>)}
              </select>
            </label>
          )}
          {draft.type === 'wait' && <NumberField label="Wait seconds" value={draft.seconds} min={0.5} max={3600} step={0.5} onChange={seconds => onDraft({ ...draft, seconds })} />}
          {draft.type === 'master-volume' && <NumberField label="Master volume" value={draft.volume} min={0} max={0.8} step={0.01} onChange={volume => onDraft({ ...draft, volume })} />}
          {draft.type === 'cue' && (
            <label>
              <span>Cue text</span>
              <input value={draft.cue} onChange={event => onDraft({ ...draft, cue: event.target.value })} />
            </label>
          )}
          <button onClick={onAdd}>Add step</button>
        </div>
      </details>
    </section>
  );
}

function MasterControl({
  master,
  reverbAmount,
  fadeInSeconds,
  fadeOutSeconds,
  sessionStatus,
  started,
  activeChannels,
  onChange,
  onReverbChange,
  onFadeInSeconds,
  onFadeOutSeconds,
}: {
  master: number;
  reverbAmount: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  sessionStatus: SessionStatus;
  started: boolean;
  activeChannels: number;
  onChange: (value: number) => void;
  onReverbChange: (value: number) => void;
  onFadeInSeconds: (value: number) => void;
  onFadeOutSeconds: (value: number) => void;
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
        <input type="range" min="0" max="0.8" step="0.01" value={master} onChange={event => onChange(Number(event.target.value))} />
      </label>
      <Control label="Shared reverb" value={reverbAmount} min={0} max={0.8} step={0.01} display={`${Math.round(reverbAmount * 100)}%`} onChange={onReverbChange} />
      <NumberField label="Fade in seconds" value={fadeInSeconds} min={0} max={60} step={1} onChange={onFadeInSeconds} />
      <NumberField label="Fade out seconds" value={fadeOutSeconds} min={0} max={90} step={1} onChange={onFadeOutSeconds} />
      <p className="status">Use headphones or a tested Zoom audio route before starting. Keep levels comfortable and increase gradually.</p>
    </section>
  );
}

function BowlPlayer({
  activeSamples,
  sampleStatus,
  sampleError,
  started,
  bowlDefaults,
  onDefaultsChange,
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
  bowlDefaults: BowlPlaybackDefaults;
  onDefaultsChange: (patch: Partial<BowlPlaybackDefaults>) => void;
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
  const selectedSampleId = `${bowlDefaults.selectedBowlId}-${bowlDefaults.selectedStyleId}`;

  return (
    <section className="bowl-player" aria-label="Bowls">
      <div className="bowl-heading">
        <div>
          <p className="eyebrow">Sample player</p>
          <h2>Bowls</h2>
          <p>{statusCopy}</p>
          <p className="bowl-note">Hz values are traditional associations used for organization, not measured acoustic frequencies.</p>
        </div>
        <div className={`sample-status ${sampleStatus.toLowerCase()}`} role="status" aria-atomic="true" aria-live="polite">
          <span aria-hidden="true" />
          {sampleStatus}
        </div>
      </div>

      {sampleError && <p className="sample-error" role="alert" aria-live="assertive">{sampleError}</p>}

      <div className="bowl-defaults" aria-label="Bowl playback defaults">
        <label>
          <span>Default bowl</span>
          <select value={bowlDefaults.selectedBowlId} onChange={event => onDefaultsChange({ selectedBowlId: event.target.value as BowlId })}>
            {bowlDefinitions.map(bowl => <option key={bowl.id} value={bowl.id}>{bowl.name}</option>)}
          </select>
        </label>
        <label>
          <span>Default style</span>
          <select value={bowlDefaults.selectedStyleId} onChange={event => onDefaultsChange({ selectedStyleId: event.target.value as BowlStyleId })}>
            {bowlStyles.map(style => <option key={style.id} value={style.id}>{style.name}</option>)}
          </select>
        </label>
        <button disabled={!started} onClick={() => onPlay(selectedSampleId)}>Play default bowl</button>
        {bowlStyles.map(style => (
          <Control
            key={style.id}
            label={`${style.name} gain`}
            value={bowlDefaults.styleGains[style.id]}
            min={0}
            max={1}
            step={0.01}
            display={`${Math.round(bowlDefaults.styleGains[style.id] * 100)}%`}
            onChange={value => onDefaultsChange({ styleGains: { ...bowlDefaults.styleGains, [style.id]: value } })}
          />
        ))}
      </div>

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
                  <button className="strike-button" disabled={!started} key={sample.id} onClick={() => onPlay(sample.id)} aria-label={`Play ${sample.label}`}>
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
                <Control label="Volume" value={sample.volume} min={0} max={1} step={0.01} display={`${Math.round(sample.volume * 100)}%`} onChange={value => onVolumeChange(sample.id, value)} />
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

function ModeToggle({ clientMode, detailMode, onClientModeChange, onDetailModeChange }: { clientMode: ClientMode; detailMode: PresentationMode; onClientModeChange: (mode: ClientMode) => void; onDetailModeChange: (mode: PresentationMode) => void }) {
  return (
    <section className="mode-row" aria-label="Presentation mode">
      <div>
        <p className="eyebrow">Interface</p>
        <h2>{clientMode === 'experience' ? 'Experience Mode' : 'Facilitator Mode'}</h2>
      </div>
      <div className="mode-controls">
        <div className="segmented" role="group" aria-label="Choose interface mode">
          <button className={clientMode === 'facilitator' ? 'selected' : ''} onClick={() => onClientModeChange('facilitator')} aria-pressed={clientMode === 'facilitator'}>Facilitator Mode</button>
          <button className={clientMode === 'experience' ? 'selected' : ''} onClick={() => onClientModeChange('experience')} aria-pressed={clientMode === 'experience'}>Experience Mode</button>
        </div>
        {clientMode === 'facilitator' && <div className="segmented detail-switch" role="group" aria-label="Choose channel detail level">
          <button className={detailMode === 'simple' ? 'selected' : ''} onClick={() => onDetailModeChange('simple')} aria-pressed={detailMode === 'simple'}>Simple</button>
          <button className={detailMode === 'advanced' ? 'selected' : ''} onClick={() => onDetailModeChange('advanced')} aria-pressed={detailMode === 'advanced'}>Advanced</button>
        </div>}
      </div>
    </section>
  );
}

function ChannelCard({ channel, mode, isActive, onChange }: {
  channel: PresetChannel;
  mode: PresentationMode;
  isActive: boolean;
  onChange: (patch: Partial<PresetChannel>) => void;
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
          <input type="checkbox" checked={channel.enabled} onChange={event => onChange({ enabled: event.target.checked })} />
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
      <input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} />
    </label>
  );
}

function NumberField({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return (
    <label className="number-field">
      <span>{label}</span>
      <input type="number" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} />
    </label>
  );
}
