# WBNS-0018 — Mixer state coalescing and persistence throttle

STATUS: READY
AGENT: ZCODE
AUTOMATION_ELIGIBLE: true
PRIORITY: 6

## Goal
Keep frequent slider interaction smooth by separating immediate UI/audio response from slower persistence work.

## Scope
- Audit local persistence/session preset writes triggered during slider movement.
- Coalesce/debounce non-authoritative persistence so drag events do not cause unnecessary storage churn.
- Preserve the latest committed value across pointer-up, keyboard changes, navigation, and reload.
- Ensure mute and stop actions remain immediate and never wait on debounce timers.

## Acceptance
- Rapid scrubbing produces bounded persistence writes while the final value is retained exactly.
- Reload restores the last committed values correctly.
- Pending persistence cannot overwrite a newer value after reordering/timing races.
- Tests cover rapid value churn, unmount/navigation, and final flush semantics.

## Constraints
No deploy/release. Preserve privacy/local-storage boundaries. End in REVIEW.