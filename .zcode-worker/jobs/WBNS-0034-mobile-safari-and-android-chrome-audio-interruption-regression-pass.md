# WBNS-0034 — Mobile Safari and Android Chrome audio-interruption regression pass

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true
**WAVE:** Pre-8PM reserve

## Goal
Add focused mobile-browser coverage for audio unlock, calls/interruptions, backgrounding, tab switches, resume, slider gestures, and session timer behavior.

## Constraints
- Preserve current-main authority, safety, privacy, and data-boundary rules.
- No production deploy/release/credential changes.
- Worker ends in REVIEW.

## Acceptance
Targeted deterministic regression evidence covers the changed behavior, existing gates remain green, and the worker reports evidence then stops in REVIEW.
