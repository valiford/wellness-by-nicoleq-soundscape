# WBNS-0067 — Output level metering and clipping alerts

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true
**BASE:** origin/main
**WAVE:** 2026-10-02 product/audio

## Objective
Add facilitator-visible output metering and bounded clipping/overload warnings so Nicole can manage session levels confidently without changing the authoritative audio mix.

## Required outcomes
- Reuse the existing Web Audio graph/analyser seam; do not create a second audio authority.
- Show responsive master-output level feedback with clear nominal/caution/overload states and reduced-motion behavior.
- Detect sustained clipping/near-clipping with bounded smoothing/hysteresis so transient peaks do not flicker warnings.
- Metering must never alter channel/master values, mute state, fades, presets, sequences, or playback.
- Provide a calibration/test harness using deterministic synthetic analyser samples; no microphone permission.
- Keep mobile facilitator and Experience Mode layouts usable and accessible.

## Constraints
No medical/healing claims, microphone access, analytics, backend, deployment, release, merge, force-push, or audio-file mutation. End in REVIEW with evidence.
