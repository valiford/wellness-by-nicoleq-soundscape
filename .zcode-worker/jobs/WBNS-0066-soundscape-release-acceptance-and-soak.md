# WBNS-0066 — Soundscape release acceptance and soak

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true
**BASE:** origin/main

## Objective
Run mobile/desktop release acceptance across mixer, presets, timer, interruptions, route changes, long-session playback, accessibility, recovery, and performance. Fix current-main defects found and leave deterministic soak/release evidence. No deploy/release.

## Constraints
Start from current `origin/main`; branch/worktree existence is lease authority. Preserve audio safety, accessibility, user-controlled playback, and deterministic state recovery. Never merge, deploy, release, force-push, or add unwanted tracking. End in REVIEW with evidence.
