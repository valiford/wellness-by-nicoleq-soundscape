# WBNS-0040 — Long-session audio performance memory and lifecycle soak

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true
**WAVE:** 2026-09-21 tomorrow priority

## Goal
Add representative long-session soak coverage for audio-node lifecycle, timers, event listeners, memory/CPU growth, suspend/resume, preset churn, and cleanup with bounded thresholds.

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
