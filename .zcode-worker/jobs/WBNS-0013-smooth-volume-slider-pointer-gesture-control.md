# WBNS-0013 — Smooth volume slider pointer/gesture control

STATUS: READY
AGENT: ZCODE
AUTOMATION_ELIGIBLE: true
PRIORITY: 1

## Goal
Eliminate jumpy/erratic volume-slider behavior and make drag, click/tap, and keyboard volume changes feel smooth, predictable, and precise.

## Scope
- Audit current range/slider pointer handling, hit geometry, state updates, audio gain updates, and render cadence.
- Prevent click-near-track jumps caused by conflicting pointer/click handlers or stale geometry.
- Use one authoritative normalized value path with clamping and stable pointer capture during drag.
- Decouple high-frequency visual drag updates from expensive audio/state persistence where appropriate without adding perceptible lag.
- Preserve mute semantics and per-layer/master-volume behavior.
- Cover mouse, touch, stylus/pointer, keyboard arrows, Home/End, and rapid direction changes.

## Acceptance
- Dragging remains continuous with no oscillation, teleporting thumb, or value reversal.
- Clicking/tapping a track moves deterministically to the intended position once.
- Audio gain follows smoothly without zipper-like bursts caused by duplicate updates.
- Automated interaction tests cover drag, track click/tap, pointer leave/re-entry, and keyboard input.
- Existing audio and accessibility tests remain green.

## Constraints
No deploy/release. Preserve wellness-only product boundaries. Finish in REVIEW with evidence.