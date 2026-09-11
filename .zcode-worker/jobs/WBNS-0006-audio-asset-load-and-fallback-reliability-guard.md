# WBNS-0006 — Audio asset load and fallback reliability guard

STATUS: READY
AGENT: ZCODE
AUTOMATION_ELIGIBLE: true

## Objective

Harden audio loading so missing, corrupt, slow, or failed media assets cannot leave the soundscape stuck, silent without explanation, or partially initialized.

## Scope

- Inventory every runtime audio asset load/decode boundary on current `origin/main`.
- Add deterministic handling for missing files, HTTP/load failures, decode failures, aborted loads, and partial asset availability.
- Ensure a failed asset does not strand controls, timers, meters, or session state in a false-playing/loading condition.
- Preserve usable tracks/effects when one independent asset fails and surface a bounded user/operator-visible fallback state.
- Verify retries/reloads do not create duplicate playback nodes or stale loading state.
- Add regression/mutation evidence proving at least one intentionally broken asset path is detected.

## Constraints

- Start from current `origin/main`.
- Preserve client-side architecture and wellness-only product boundaries.
- Do not add unlicensed third-party audio or replace approved/original/synthetic assets.
- Never deploy, release, publish, or merge from the worker.
- End in REVIEW with a concise report of failures covered, tests run, and remaining risks.
