# WBNS-0005 — Bowl Sequence Timing and Cancellation Determinism Guard

STATUS: READY
PRIORITY: 5
AGENT: ZCODE
AUTOMATION_ELIGIBLE: true
DEPENDENCIES: None.
BASE: main
DO_NOT_MERGE: true
DO_NOT_DEPLOY: true
TARGET_DURATION: ~60 minutes

## Objective

Protect bowl playback and programmed sequences from duplicate triggers, stale timers, overlapping cancellation, or timing drift that could disrupt a live session.

## Scope

- Inventory `bowlSamplePlayer.ts`, `sequenceRunner.ts`, and `useSequenceRunner.ts`.
- Add deterministic coverage for start, stop, restart, rapid sequence switching, cancellation during playback, and end-of-sequence cleanup.
- Do not add unlicensed audio or change approved sample provenance.

## Acceptance criteria

1. Stopping a sequence cancels future scheduled events cleanly.
2. Restarting cannot leave old timers/nodes active.
3. Rapid switching yields one canonical active sequence.
4. Existing bowl/preset/experience smoke tests remain green.

## Verification

- `npm run build`
- Run all existing smoke scripts relevant to the touched area.
- Add focused automated regression coverage where practical.
- `git diff --check`

## Product boundaries

- Keep the app client-side.
- Do not add accounts, client data collection, analytics, or external runtime services.
- Do not make medical/audiological/guaranteed-outcome claims.
- Use only original, licensed, or synthetic audio.
- Preserve desktop Chrome/Edge live-facilitation behavior.

## Completion

1. Commit focused work on the job branch.
2. Write `.zcode-worker/reports/WBNS-0005.md`.
3. Successful work ends in REVIEW.
4. Never merge or deploy.
