# WBNS-0064 — Audio engine crossfade and node lifecycle

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true
**BASE:** origin/main

## Objective
Harden the audio engine for smooth gain ramps/crossfades, bounded node creation/destruction, mute/unmute transitions, source replacement, and long-session memory/CPU stability without clicks, stacked playback, or leaked nodes.

## Constraints
Start from current `origin/main`; branch/worktree existence is lease authority. Preserve audio safety, accessibility, user-controlled playback, and deterministic state recovery. Never merge, deploy, release, force-push, or add unwanted tracking. End in REVIEW with evidence.
