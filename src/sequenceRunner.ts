import { BowlSequence, BowlSequenceStep } from './presetManager';

export type SequenceStatus = 'Idle' | 'Running' | 'Paused' | 'Complete';

export type SequenceSnapshot = {
  status: SequenceStatus;
  currentIndex: number;
  elapsedSeconds: number;
  remainingWaitSeconds: number;
  currentStep: BowlSequenceStep | null;
  nextStep: BowlSequenceStep | null;
};

type RunnerHandlers = {
  onStep: (step: BowlSequenceStep) => void | Promise<void>;
  onSnapshot: (snapshot: SequenceSnapshot) => void;
  onStateChange: (message: string) => void;
};

const emptySnapshot: SequenceSnapshot = {
  status: 'Idle',
  currentIndex: -1,
  elapsedSeconds: 0,
  remainingWaitSeconds: 0,
  currentStep: null,
  nextStep: null,
};

export class SequenceRunner {
  private sequence: BowlSequence | null = null;
  private status: SequenceStatus = 'Idle';
  private currentIndex = -1;
  private elapsedSeconds = 0;
  private remainingWaitSeconds = 0;
  private waitStartedAt = 0;
  private waitDuration = 0;
  private timeoutId: number | null = null;
  private tickId: number | null = null;

  constructor(private readonly handlers: RunnerHandlers) {}

  start(sequence: BowlSequence) {
    this.stop(false);
    this.sequence = sequence;
    this.status = 'Running';
    this.currentIndex = -1;
    this.elapsedSeconds = 0;
    this.handlers.onStateChange('Sequence started.');
    this.advance(1);
  }

  pause() {
    if (this.status !== 'Running') return;
    const step = this.currentStep();
    if (step?.type === 'wait') {
      const elapsedWait = (Date.now() - this.waitStartedAt) / 1000;
      this.remainingWaitSeconds = Math.max(0, this.waitDuration - elapsedWait);
    }
    this.clearTimers();
    this.status = 'Paused';
    this.handlers.onStateChange('Sequence paused.');
    this.emit();
  }

  resume() {
    if (this.status !== 'Paused' || !this.sequence) return;
    this.status = 'Running';
    this.handlers.onStateChange('Sequence resumed.');
    const step = this.currentStep();
    if (step?.type === 'wait' && this.remainingWaitSeconds > 0) {
      this.scheduleWait(this.remainingWaitSeconds);
    } else {
      this.advance(1);
    }
    this.emit();
  }

  skip() {
    if (this.status !== 'Running' && this.status !== 'Paused') return;
    this.clearTimers();
    this.status = 'Running';
    this.handlers.onStateChange('Skipped to next sequence step.');
    this.advance(1);
  }

  previous() {
    if ((this.status !== 'Running' && this.status !== 'Paused') || !this.sequence) return;
    this.clearTimers();
    this.status = 'Running';
    this.currentIndex = Math.max(-1, this.currentIndex - 2);
    this.handlers.onStateChange('Returned to previous sequence step.');
    this.advance(1);
  }

  stop(announce = true) {
    this.clearTimers();
    this.sequence = null;
    this.status = 'Idle';
    this.currentIndex = -1;
    this.elapsedSeconds = 0;
    this.remainingWaitSeconds = 0;
    if (announce) this.handlers.onStateChange('Sequence stopped.');
    this.emit();
  }

  snapshot() {
    return this.makeSnapshot();
  }

  private advance(direction: 1) {
    if (!this.sequence) return;
    this.clearTimers();
    this.currentIndex += direction;
    this.remainingWaitSeconds = 0;
    if (this.currentIndex >= this.sequence.steps.length) {
      this.status = 'Complete';
      this.handlers.onStateChange('Sequence complete.');
      this.emit();
      return;
    }

    const step = this.sequence.steps[this.currentIndex];
    this.handlers.onStep(step);
    if (step.type === 'wait') {
      this.scheduleWait(step.seconds);
      return;
    }
    this.emit();
  }

  private scheduleWait(seconds: number) {
    this.waitDuration = seconds;
    this.remainingWaitSeconds = seconds;
    this.waitStartedAt = Date.now();
    this.tickId = window.setInterval(() => {
      const elapsedWait = (Date.now() - this.waitStartedAt) / 1000;
      this.remainingWaitSeconds = Math.max(0, this.waitDuration - elapsedWait);
      this.elapsedSeconds += 1;
      this.emit();
    }, 1000);
    this.timeoutId = window.setTimeout(() => this.advance(1), seconds * 1000);
    this.emit();
  }

  private clearTimers() {
    if (this.timeoutId !== null) window.clearTimeout(this.timeoutId);
    if (this.tickId !== null) window.clearInterval(this.tickId);
    this.timeoutId = null;
    this.tickId = null;
  }

  private currentStep() {
    if (!this.sequence || this.currentIndex < 0) return null;
    return this.sequence.steps[this.currentIndex] ?? null;
  }

  private makeSnapshot(): SequenceSnapshot {
    if (!this.sequence) return { ...emptySnapshot, status: this.status };
    return {
      status: this.status,
      currentIndex: this.currentIndex,
      elapsedSeconds: this.elapsedSeconds,
      remainingWaitSeconds: Math.ceil(this.remainingWaitSeconds),
      currentStep: this.currentStep(),
      nextStep: this.sequence.steps[this.currentIndex + 1] ?? null,
    };
  }

  private emit() {
    this.handlers.onSnapshot(this.makeSnapshot());
  }
}

export const initialSequenceSnapshot = emptySnapshot;
