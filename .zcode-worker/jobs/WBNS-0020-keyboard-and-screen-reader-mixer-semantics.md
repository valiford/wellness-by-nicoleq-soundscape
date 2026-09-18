# WBNS-0020 — Keyboard and screen-reader mixer semantics

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true

## Goal
Harden keyboard adjustment, focus order, labels, current-value announcements, mute state, and touch-target semantics for mixer controls.

## Constraints
- Keep the app client-side and preserve existing licensed/original/synthetic audio boundaries.
- Do not add camera, location, network, cloud, account, or vendor requirements.
- Preserve wellness-only claims and user-controlled playback authority.
- Worker ends in REVIEW; never publish or deploy.

## Acceptance
Relevant interaction/audio lifecycle tests cover the changed behavior and existing build/accessibility/performance checks remain green.
