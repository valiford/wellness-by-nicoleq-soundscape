# WBNS-0062 — Session timer, fade-out, and sleep continuity

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true
**BASE:** origin/main

## Objective
Complete session timer behavior across backgrounding, screen lock, interruption, pause/resume, expiry, graceful fade-out, reload/reopen continuity, and user cancellation without duplicate timers or abrupt audio transitions.

## Constraints
Start from current `origin/main`; branch/worktree existence is lease authority. Preserve audio safety, accessibility, user-controlled playback, and deterministic state recovery. Never merge, deploy, release, force-push, or add unwanted tracking. End in REVIEW with evidence.
