# WBNS-0052 — Crossfade and gain-ramp audio quality implementation

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true
**WAVE:** 2026-09-22 today priority

## Goal
Implement bounded gain ramps/crossfades for layer on/off, mute/unmute, volume changes, and preset recall while reaching exact requested target values and avoiding zipper noise.

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
