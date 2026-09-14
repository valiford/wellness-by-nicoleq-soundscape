# WBNS-0012 — Session timer drift/backgrounding guard

STATUS: READY
PRIORITY: 12
AGENT: ZCODE
AUTOMATION_ELIGIBLE: true
DEPENDENCIES: none
BASE: main
DO_NOT_MERGE: true
DO_NOT_DEPLOY: true

## Objective
Prevent session/bowl timing from drifting when timers are throttled by backgrounding, sleep, or delayed callbacks.

## Acceptance
Use elapsed-time authority rather than callback count where appropriate; cover long pauses, delayed ticks, cancellation, and resume without burst playback. Preserve existing Experience/Facilitator behavior. Add tests, run full verification, commit, and report `.zcode-worker/reports/WBNS-0012.md`; finish REVIEW only.