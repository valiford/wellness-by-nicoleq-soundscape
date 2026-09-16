# WBNS-0017 — Mobile mixer ergonomics and gesture isolation

STATUS: READY
AGENT: ZCODE
AUTOMATION_ELIGIBLE: true
PRIORITY: 5

## Goal
Make mixing on phones and split-screen layouts comfortable without accidental page scrolling or unintended control jumps.

## Scope
- Audit touch-action, scroll containment, pointer capture, and nested interactive regions around sliders.
- Prevent a slider drag from becoming page scroll and prevent ordinary page scroll from changing a slider.
- Refine compact layout spacing, labels, value readouts, and thumb hit areas.
- Preserve keyboard and screen-reader semantics.

## Acceptance
- Vertical page scrolling near controls does not mutate volume unless the slider was intentionally engaged.
- Engaged slider drags stay attached to the correct control until release/cancel.
- Compact layouts remain readable and usable one-handed.
- Automated tests cover touch-drag versus page-scroll isolation and pointer cancellation.

## Constraints
No deploy/release. Preserve current app architecture and sound semantics. End in REVIEW.