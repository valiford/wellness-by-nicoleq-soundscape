# WBNS-0059 — Audio accessibility and long-session stability gate

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true
**WAVE:** Pre-9PM reserve 2026-09-24

## Goal
Add keyboard/screen-reader/reduced-motion/touch checks plus long-session node/listener/memory/CPU soak tests and browser-specific audio interruption coverage.

## Constraints
- Keep Soundscape client-side. Do not add PostgreSQL, accounts, camera, location, cloud, network-service, or vendor dependencies. Preserve wellness-only claims and approved audio boundaries.
- Start from current `origin/main`; branch/worktree existence is lease authority.
- Preserve review evidence and do not force stale branches.
- No production deploy/release/credential change.
- Worker ends in REVIEW.

## Acceptance
- Current-main implementation with deterministic regression/integration evidence.
- Relevant dataload/migrations are idempotent and provenance-preserving.
- Existing safety/build/test/accessibility guards remain green.
- Report evidence and stop in REVIEW.
