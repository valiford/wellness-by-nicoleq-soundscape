# WBNS-0003 — Session Preset Persistence and Schema Resilience Guard

STATUS: READY
PRIORITY: 3
AGENT: ZCODE
AUTOMATION_ELIGIBLE: true
DEPENDENCIES: None.
BASE: main
DO_NOT_MERGE: true
DO_NOT_DEPLOY: true
TARGET_DURATION: ~60 minutes

## Objective

Protect saved presets and sequences from malformed localStorage, stale schema versions, duplicate names/IDs, or partial writes while preserving current built-in presets.

## Scope

- Inventory `presetManager.ts`, `useSessionPresets.ts`, and sequence persistence.
- Add tests for round-trip serialization, malformed JSON, missing fields, unknown future fields, duplicates, and storage quota/write failure.
- Keep the app account-free and entirely local.

## Acceptance criteria

1. Valid presets round-trip without drift.
2. Malformed or stale local data fails safely and does not crash the console.
3. Built-in presets remain available even if custom storage is corrupt.
4. No client-sensitive data is introduced.

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
2. Write `.zcode-worker/reports/WBNS-0003.md`.
3. Successful work ends in REVIEW.
4. Never merge or deploy.
