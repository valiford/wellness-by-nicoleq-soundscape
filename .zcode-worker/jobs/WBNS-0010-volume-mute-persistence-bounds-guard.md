# WBNS-0010 — Volume/mute persistence bounds guard

STATUS: READY
AGENT: ZCODE
AUTOMATION_ELIGIBLE: true
DEPENDENCIES: none

## Objective
Keep persisted volume/mute state valid and bounded after reloads or malformed local storage.

## Scope
- Add focused fixtures for missing, malformed, negative, and over-range stored volume values.
- Clamp/fallback safely while preserving valid settings.
- Do not broaden stored personal data.

## Acceptance criteria
1. Invalid persisted volume cannot cause crashes or unsafe gain values.
2. Valid mute/volume settings round-trip predictably.
3. Focused tests and `git diff --check` pass.

## Boundaries
- Client-side only; no analytics, deployment, release, publishing, or merge.
- Successful autonomous work ends in REVIEW.