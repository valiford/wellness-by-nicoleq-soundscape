# WBNS-0007 — Playback node teardown and duplicate-session guard

STATUS: READY
AGENT: ZCODE
AUTOMATION_ELIGIBLE: true

## Objective

Prevent repeated starts, stops, mode switches, route changes, or reload-like transitions from leaving duplicate audio nodes, timers, event handlers, or stale session state active in the browser.

## Scope

- Inventory playback-node, timer, listener, and session teardown paths on current `origin/main`.
- Add deterministic guards for repeated start/stop cycles, rapid mode changes, cancellation, and restart of a session.
- Verify only one logical playback graph/session remains active after each transition.
- Ensure meters, timers, fades, and bowl-sequence callbacks are detached or cancelled when their owning session ends.
- Add bounded long-session/repetition tests that detect node/listener/timer accumulation without requiring production deployment.
- Add mutation/detection evidence proving at least one intentionally omitted teardown is caught.

## Constraints

- Start from current `origin/main`.
- Preserve existing audio behavior, client-side architecture, and approved wellness UX.
- Do not introduce new third-party audio or tracking dependencies.
- Never merge, deploy, release, or publish from the worker.
- End in REVIEW with a concise report of lifecycle invariants, tests, and any browser-specific limitations.
