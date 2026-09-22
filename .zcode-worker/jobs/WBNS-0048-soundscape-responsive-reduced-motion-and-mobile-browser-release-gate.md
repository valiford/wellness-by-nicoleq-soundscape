# WBNS-0048 — Soundscape responsive reduced-motion and mobile-browser release gate

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true
**WAVE:** 2026-09-22 today priority

## Goal
Create deterministic Chrome/Android/Safari-oriented interaction, reduced-motion, responsive, accessibility, interruption, and recovery regression coverage without adding new permissions or services.

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
