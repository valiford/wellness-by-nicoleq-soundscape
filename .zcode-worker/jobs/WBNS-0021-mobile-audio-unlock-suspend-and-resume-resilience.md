# WBNS-0021 — Mobile audio unlock suspend and resume resilience

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true

## Goal
Add deterministic handling for browser audio unlock, visibility changes, interruptions, suspend/resume, and user-initiated recovery on mobile browsers.

## Constraints
- Keep the app client-side and preserve existing licensed/original/synthetic audio boundaries.
- Do not add camera, location, network, cloud, account, or vendor requirements.
- Preserve wellness-only claims and user-controlled playback authority.
- Worker ends in REVIEW; never publish or deploy.

## Acceptance
Relevant interaction/audio lifecycle tests cover the changed behavior and existing build/accessibility/performance checks remain green.
