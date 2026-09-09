# WBNS-0001 — Audio Context Lifecycle and Resume Guard

STATUS: READY
PRIORITY: 1
AGENT: ZCODE
AUTOMATION_ELIGIBLE: true
DEPENDENCIES: None.
BASE: main
DO_NOT_MERGE: true
DO_NOT_DEPLOY: true
TARGET_DURATION: ~60 minutes

## Objective

Protect live-session audio startup, suspend/resume, browser visibility changes, and repeated Start audio actions from leaving duplicate nodes, silent output, or stuck controls.

## Scope

- Inventory the Web Audio context lifecycle in `audioEngine.ts` and the app shell before changing it.
- Add deterministic coverage for first start, repeated start, suspend/resume, emergency mute during resume, and teardown/restart.
- Prefer minimal lifecycle fixes over audio-engine redesign.

## Acceptance criteria

1. Audio starts only from explicit user action.
2. Repeated starts do not duplicate sources or increase output unexpectedly.
3. Resume after suspension restores the intended session state.
4. Emergency mute remains authoritative through lifecycle transitions.

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
2. Write `.zcode-worker/reports/WBNS-0001.md`.
3. Successful work ends in REVIEW.
4. Never merge or deploy.
