# WBNS-0036 — Mixer presets undo reset and recovery workflow

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true
**WAVE:** 2026-09-21 tomorrow priority

## Goal
Add local-only named presets plus predictable undo/reset/revert behavior so accidental mixer changes are recoverable without accounts, cloud state, or network dependencies.

## Constraints
- This app remains client-side; do not add PostgreSQL, accounts, camera, location, cloud, network-service, or vendor dependencies. Preserve wellness-only claims and licensed/original/synthetic audio boundaries.
- Start from current `origin/main`.
- No production secrets, deployment, release, or credential changes.
- Worker ends in REVIEW.

## Acceptance
- Deterministic regression/integration evidence covers success and relevant failure/recovery paths.
- Existing build/test/safety contracts remain green.
- Postgres work uses versioned migrations and bounded/redacted diagnostics where applicable.
- Report evidence and stop in REVIEW.
