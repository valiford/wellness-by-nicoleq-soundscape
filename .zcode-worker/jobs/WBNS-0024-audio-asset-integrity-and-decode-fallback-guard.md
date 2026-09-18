# WBNS-0024 — Audio asset integrity and decode fallback guard

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true

## Goal
Validate expected asset metadata and decode/load failure behavior with bounded fallbacks, clear diagnostics, and no external media substitution.

## Constraints
- Keep the app client-side and preserve existing licensed/original/synthetic audio boundaries.
- Do not add camera, location, network, cloud, account, or vendor requirements.
- Preserve wellness-only claims and user-controlled playback authority.
- Worker ends in REVIEW; never publish or deploy.

## Acceptance
Relevant interaction/audio lifecycle tests cover the changed behavior and existing build/accessibility/performance checks remain green.
