# WBNS-0023 — Session timer persistence and recovery guard

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true

## Goal
Persist and recover timer/session state across reload, backgrounding, clock changes, and interrupted playback without silently extending sessions.

## Constraints
- Keep the app client-side and preserve existing licensed/original/synthetic audio boundaries.
- Do not add camera, location, network, cloud, account, or vendor requirements.
- Preserve wellness-only claims and user-controlled playback authority.
- Worker ends in REVIEW; never publish or deploy.

## Acceptance
Relevant interaction/audio lifecycle tests cover the changed behavior and existing build/accessibility/performance checks remain green.
