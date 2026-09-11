# WBNS-0009 — Keyboard media-control semantics guard

STATUS: READY
AGENT: ZCODE
AUTOMATION_ELIGIBLE: true
DEPENDENCIES: none

## Objective
Keep core soundscape playback controls operable and understandable from the keyboard without duplicate activation.

## Scope
- Cover play/pause, stop, mute, and primary sequence controls on current main.
- Verify keyboard activation, accessible names, and focus behavior with focused tests.
- Preserve existing audio behavior and visual design.

## Acceptance criteria
1. Core controls are keyboard operable with stable accessible names.
2. Enter/Space activation cannot accidentally fire twice.
3. Focused tests and `git diff --check` pass.

## Boundaries
- No audio redesign, deployment, release, publishing, or merge.
- Successful autonomous work ends in REVIEW.