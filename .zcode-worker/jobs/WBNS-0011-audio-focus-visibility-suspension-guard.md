# WBNS-0011 — Audio visibility/suspension recovery guard

STATUS: READY
PRIORITY: 11
AGENT: ZCODE
AUTOMATION_ELIGIBLE: true
DEPENDENCIES: none
BASE: main
DO_NOT_MERGE: true
DO_NOT_DEPLOY: true

## Objective
Keep a facilitated sound session truthful and recoverable when the browser tab backgrounds, the device suspends audio, or the AudioContext changes state.

## Acceptance
Cover hidden/visible transitions, suspended/interrupted/resumed contexts, repeated resume attempts, and no duplicate playback nodes. Preserve client-side architecture and wellness-only boundaries. Add deterministic tests, run full verification, commit, and report `.zcode-worker/reports/WBNS-0011.md`; finish REVIEW only.