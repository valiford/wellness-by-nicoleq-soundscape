# WBNS-0037 — Audio interruption background resume and timer continuity

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true
**WAVE:** 2026-09-21 tomorrow priority

## Goal
Harden mobile browser audio unlock, calls/interruptions, tab/background transitions, sleep/wake, explicit resume, and session timer continuity without silently extending sessions.

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
