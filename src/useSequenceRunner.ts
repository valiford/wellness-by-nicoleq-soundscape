import { useMemo, useRef, useState } from 'react';
import { bowlSamples } from './bowlSamplePlayer';
import { BowlSequence, BowlSequenceStep } from './presetManager';
import { SequenceRunner, SequenceSnapshot, initialSequenceSnapshot } from './sequenceRunner';

export type SequenceDraft = {
  type: BowlSequenceStep['type'];
  sampleId: string;
  seconds: number;
  volume: number;
  cue: string;
};

type SequenceActions = {
  onPlaySample: (sampleId: string) => void;
  onFadeBowls: () => void;
  onStopBowls: () => void;
  onMasterVolume: (volume: number) => void;
};

type UseSequenceRunnerOptions = {
  initialMaster: number;
  onAnnouncement: (message: string) => void;
  actions: SequenceActions;
};

export const emptySequence: BowlSequence = { id: 'sequence-current', name: 'Current sequence', steps: [] };

export function stepLabel(step: BowlSequenceStep | null) {
  if (!step) return 'None';
  if (step.type === 'cue') return `${step.label}: ${step.text}`;
  if (step.type === 'wait') return `${step.label} (${step.seconds}s)`;
  if (step.type === 'master-volume') return `${step.label} (${Math.round(step.volume * 100)}%)`;
  return step.label;
}

export function useSequenceRunner({ initialMaster, onAnnouncement, actions }: UseSequenceRunnerOptions) {
  const actionRef = useRef(actions);
  actionRef.current = actions;
  const [sequenceSnapshot, setSequenceSnapshot] = useState<SequenceSnapshot>(initialSequenceSnapshot);
  const [sequenceDraft, setSequenceDraft] = useState<SequenceDraft>({
    type: 'cue',
    sampleId: 'root-regular-strike',
    seconds: 5,
    volume: initialMaster,
    cue: 'Offer a quiet facilitator cue.',
  });

  const runner = useMemo(() => new SequenceRunner({
    onStep: step => {
      if (step.type === 'play-sample') actionRef.current.onPlaySample(step.sampleId);
      if (step.type === 'fade-bowls') actionRef.current.onFadeBowls();
      if (step.type === 'stop-bowls') actionRef.current.onStopBowls();
      if (step.type === 'master-volume') actionRef.current.onMasterVolume(step.volume);
    },
    onSnapshot: setSequenceSnapshot,
    onStateChange: onAnnouncement,
  }), [onAnnouncement]);

  const startSequence = (started: boolean, sequence: BowlSequence | undefined) => {
    if (!started || !sequence || sequence.steps.length === 0) return;
    runner.start(sequence);
  };

  const clearSequence = (setSequence: (updater: BowlSequence) => void) => {
    runner.stop(false);
    setSequence({ id: `sequence-${Date.now()}`, name: 'Custom sequence', steps: [] });
    onAnnouncement('Sequence cleared.');
  };

  const addSequenceStep = (setSequence: (updater: (current: BowlSequence | undefined) => BowlSequence) => void) => {
    const id = `step-${Date.now()}`;
    let step: BowlSequenceStep;
    if (sequenceDraft.type === 'play-sample') {
      const sample = bowlSamples.find(item => item.id === sequenceDraft.sampleId) ?? bowlSamples[0];
      step = { id, type: 'play-sample', sampleId: sample.id, label: sample.label };
    } else if (sequenceDraft.type === 'wait') {
      step = { id, type: 'wait', seconds: Math.max(0.5, sequenceDraft.seconds), label: 'Wait' };
    } else if (sequenceDraft.type === 'fade-bowls') {
      step = { id, type: 'fade-bowls', label: 'Fade out active bowls' };
    } else if (sequenceDraft.type === 'stop-bowls') {
      step = { id, type: 'stop-bowls', label: 'Stop active bowls' };
    } else if (sequenceDraft.type === 'master-volume') {
      step = { id, type: 'master-volume', volume: sequenceDraft.volume, label: 'Change master volume' };
    } else {
      step = { id, type: 'cue', text: sequenceDraft.cue, label: 'Facilitator cue' };
    }
    setSequence(current => ({
      id: current?.id ?? `sequence-${Date.now()}`,
      name: current?.name ?? 'Custom sequence',
      steps: [...(current?.steps ?? []), step],
    }));
    onAnnouncement('Sequence step added.');
  };

  const removeSequenceStep = (setSequence: (updater: (current: BowlSequence | undefined) => BowlSequence | undefined) => void, id: string) => {
    setSequence(current => current ? { ...current, steps: current.steps.filter(step => step.id !== id) } : current);
  };

  const moveSequenceStep = (setSequence: (updater: (current: BowlSequence | undefined) => BowlSequence | undefined) => void, id: string, direction: -1 | 1) => {
    setSequence(current => {
      if (!current) return current;
      const steps = [...current.steps];
      const index = steps.findIndex(step => step.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= steps.length) return current;
      const [step] = steps.splice(index, 1);
      steps.splice(nextIndex, 0, step);
      return { ...current, steps };
    });
  };

  return {
    runner,
    sequenceSnapshot,
    sequenceDraft,
    setSequenceDraft,
    startSequence,
    clearSequence,
    addSequenceStep,
    removeSequenceStep,
    moveSequenceStep,
  };
}
