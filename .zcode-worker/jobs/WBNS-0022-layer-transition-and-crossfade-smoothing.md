# WBNS-0022 — Layer transition and crossfade smoothing

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true

## Goal
Smooth user-requested layer enable/disable and volume transitions while preserving requested target values and preventing zipper noise or surprise jumps.

## Constraints
- Keep the app client-side and preserve existing licensed/original/synthetic audio boundaries.
- Do not add camera, location, network, cloud, account, or vendor requirements.
- Preserve wellness-only claims and user-controlled playback authority.
- Worker ends in REVIEW; never publish or deploy.

## Acceptance
Relevant interaction/audio lifecycle tests cover the changed behavior and existing build/accessibility/performance checks remain green.
