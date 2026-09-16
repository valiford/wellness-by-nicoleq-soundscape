# WBNS-0014 — Slider cross-browser latency and input regression lab

STATUS: READY
AGENT: ZCODE
AUTOMATION_ELIGIBLE: true
PRIORITY: 2

## Goal
Make volume and mix controls consistently responsive across desktop and mobile browsers under fast repeated interaction.

## Scope
- Build focused interaction tests for Chromium/WebKit-style pointer behavior and touch emulation where supported.
- Measure/reason about update frequency, duplicate handlers, layout reads, React/state churn, and audio parameter writes.
- Exercise rapid scrubbing, tiny drags, long drags, multi-slider changes, resize/orientation changes, and reduced-motion settings.
- Remove avoidable layout thrash and stale-coordinate calculations.

## Acceptance
- No erratic jumps, double application, stuck pointer capture, or delayed thumb position under stress fixtures.
- Slider interaction remains bounded and deterministic after viewport changes.
- Focused regression suite fails against the demonstrated bug class and passes after the fix.
- No new production dependency unless clearly justified.

## Constraints
No deploy/release. Preserve existing sound semantics and licensed/original/synthetic audio boundaries. End in REVIEW.