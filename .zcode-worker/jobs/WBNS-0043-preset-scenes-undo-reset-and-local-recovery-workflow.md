# WBNS-0043 — Preset scenes undo reset and local recovery workflow

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true
**WAVE:** 2026-09-22 today priority

## Goal
Add local-only named presets, recent-change undo, reset/revert, validation, and safe preset recall without accounts, cloud persistence, or network dependencies.

## Constraints
- Soundscape remains client-side; do not add PostgreSQL, accounts, camera, location, cloud, network-service, or vendor dependencies. Preserve wellness-only claims and licensed/original/synthetic audio boundaries.
- Start from current `origin/main`.
- Add no production secrets, unreviewed provider credentials, or hidden direct-database client paths.
- Worker ends in REVIEW; never merge, deploy, publish, or release.

## Acceptance
- Deterministic integration/regression evidence covers success and relevant stale/duplicate/failure/recovery paths.
- Existing build/test/safety gates remain green.
- PostgreSQL work uses versioned migrations, idempotent loading, provenance, and bounded/redacted diagnostics where applicable.
- Report evidence and stop in REVIEW.
