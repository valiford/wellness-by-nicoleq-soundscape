# WBNS-0008 — Offline/reload and unavailable-media recovery guard

STATUS: READY
AGENT: ZCODE
AUTOMATION_ELIGIBLE: true

## Objective

Harden the soundscape against browser reloads, transient offline periods, and unavailable media so the app recovers predictably without corrupted session state or false playback status.

## Scope

- Inventory current reload/session restoration and media-fetch behavior on `origin/main`.
- Add deterministic coverage for reload during idle, loading, active playback, paused/stopped states, and transient asset unavailability.
- Verify persisted settings/session data recover safely without auto-starting audio unexpectedly or reporting playback that is not actually occurring.
- Ensure unavailable assets produce bounded fallback behavior and can recover after connectivity/media availability returns.
- Verify recovery does not duplicate timers, audio nodes, listeners, or bowl-sequence callbacks.
- Add regression/mutation evidence proving at least one broken reload/offline recovery path is detected.

## Constraints

- Start from current `origin/main`.
- Preserve browser autoplay/user-gesture requirements and client-side architecture.
- Preserve wellness-only claims and licensed/original/synthetic audio boundaries.
- Do not add service-worker/offline caching architecture unless clearly required and covered by tests; prefer minimal current-architecture hardening.
- Never merge, deploy, release, or publish from the worker.
- End in REVIEW with a concise report of scenarios covered, tests, and remaining browser/platform limitations.
