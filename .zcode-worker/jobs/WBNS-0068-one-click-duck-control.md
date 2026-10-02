# WBNS-0068 — One-click facilitator duck control with safe restore

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true
**BASE:** origin/main
**WAVE:** 2026-10-02 product/audio

## Objective
Add a one-click DUCK control that temporarily lowers the soundscape beneath Nicole's voice and restores the exact prior audible state safely.

## Required outcomes
- Duck operates on the existing master/output path and never rewrites individual channel or preset values.
- Use bounded gain ramps for duck and restore; repeated presses are idempotent and do not accumulate attenuation.
- Preserve the pre-duck master level across mute, stop, fade, mode changes, and component recreation; refuse unsafe restore after a conflicting authoritative action.
- Expose clear active/restore feedback with keyboard and touch operation.
- Add deterministic state-machine and audio-node tests for rapid toggles, fade overlap, mute/stop while ducked, and teardown.
- Keep emergency Mute All immediate and higher priority than duck.

## Constraints
No microphone permission, voice detection, tracking, backend, deployment, release, merge, force-push, or audio-file mutation. End in REVIEW.
