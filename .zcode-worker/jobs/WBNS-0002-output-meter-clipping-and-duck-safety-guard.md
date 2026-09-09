# WBNS-0002 — Output Meter Clipping and Duck Safety Guard

STATUS: READY
PRIORITY: 2
AGENT: ZCODE
AUTOMATION_ELIGIBLE: true
DEPENDENCIES: None.
BASE: main
DO_NOT_MERGE: true
DO_NOT_DEPLOY: true
TARGET_DURATION: ~60 minutes

## Objective

Lock down output metering, clipping warnings, master mute, fades, and ducking behavior so live facilitation controls remain predictable under high combined channel levels.

## Scope

- Inventory `OutputSafetyMeter`, `useOutputMeter`, master gain/fade behavior, and any existing duck control.
- Add focused tests/smokes for high combined levels, mute, fade interruption, duck/release, and recovery.
- Do not increase default loudness or weaken safety thresholds.

## Acceptance criteria

1. Clipping/over-level conditions are surfaced consistently.
2. Master mute overrides fades/duck and acts immediately.
3. Duck/release returns to the prior safe master state without gain jumps.
4. No audible-click-prone abrupt gain changes are introduced.

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
2. Write `.zcode-worker/reports/WBNS-0002.md`.
3. Successful work ends in REVIEW.
4. Never merge or deploy.
