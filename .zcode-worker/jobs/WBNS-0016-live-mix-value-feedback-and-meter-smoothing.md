# WBNS-0016 — Live mix value feedback and meter smoothing

STATUS: READY
AGENT: ZCODE
AUTOMATION_ELIGIBLE: true
PRIORITY: 4

## Goal
Make the visual response of the mixer feel fluid and trustworthy while users adjust levels.

## Scope
- Audit level readouts/meters for jitter, excessive rerenders, abrupt interpolation, and stale state.
- Smooth purely visual meter movement without hiding clipping or changing actual audio gain authority.
- Keep numeric/semantic values accurate while animation remains visually stable.
- Avoid animation work when controls are idle and honor reduced-motion preferences.

## Acceptance
- Meter/value presentation stays stable during rapid slider movement and simultaneous layer changes.
- No visual easing changes the authoritative audio value or delays mute/stop semantics.
- Reduced-motion mode remains usable and truthful.
- Focused tests cover rapid updates, mute transitions, and idle settling.

## Constraints
No deploy/release. Do not fabricate audio measurements. End in REVIEW with evidence.