# WBNS-0030 — Layer crossfade and transition smoothing

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true
**WAVE:** Tomorrow priority

## Goal
Add bounded gain ramps/crossfades for user-driven layer enable/disable and volume transitions to avoid zipper noise and surprise jumps while reaching the requested target.

## Constraints
- Keep the app client-side and preserve licensed/original/synthetic audio boundaries. Do not add camera, location, account, cloud, network-service, or vendor requirements. Preserve wellness-only claims.
- Preserve current-main safety, privacy, compatibility, and data-authority boundaries.
- No production secrets or environment-specific credentials in source.
- Worker ends in REVIEW; never merge, deploy, publish, or release.

## Acceptance
- Deterministic tests/regression evidence cover success and relevant stale/duplicate/failure/recovery paths.
- Existing build/test/safety suites remain green.
- Diagnostics are bounded and redacted.
- Report evidence and stop in REVIEW.
