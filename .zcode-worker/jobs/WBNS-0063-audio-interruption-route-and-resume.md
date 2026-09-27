# WBNS-0063 — Audio interruption, route change, and resume

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true
**BASE:** origin/main

## Objective
Harden audio behavior across incoming calls, Bluetooth/headphone route changes, browser visibility changes, OS audio suspension, accidental refresh, and resumed playback so state remains truthful and audio never unexpectedly doubles.

## Constraints
Start from current `origin/main`; branch/worktree existence is lease authority. Preserve audio safety, accessibility, user-controlled playback, and deterministic state recovery. Never merge, deploy, release, force-push, or add unwanted tracking. End in REVIEW with evidence.
