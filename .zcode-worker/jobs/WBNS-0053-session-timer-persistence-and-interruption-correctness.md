# WBNS-0053 — Session timer persistence and interruption correctness

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true
**WAVE:** 2026-09-22 today priority

## Goal
Harden timer state across backgrounding, reload, clock changes, audio suspension, manual pause/resume, and completion so sessions never silently extend or double-count.

## Constraints
- Keep Soundscape client-side. Do not add PostgreSQL, accounts, camera, location, cloud, network-service, or vendor dependencies. Preserve wellness-only claims and approved audio boundaries.
- Start from current `origin/main`; branch/worktree existence is the lease authority.
- Preserve review evidence; do not force stale branches.
- No production deployment/release/credential changes.
- Worker ends in REVIEW.

## Acceptance
- Deterministic regression/integration evidence covers success and relevant failure/recovery paths.
- Relevant PG migrations/imports are idempotent and provenance-preserving.
- Existing safety/build/test/accessibility guards remain green.
- Report evidence and stop in REVIEW.
